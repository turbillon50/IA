import { createHash, createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, verify, type KeyObject } from 'node:crypto';

export const token = () => randomBytes(32).toString('base64url');
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function equal(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ':' + canonical(v)).join(',') + '}';
  return JSON.stringify(value);
}
export function subscriptionId(principal: string, url: string, name: string, args: unknown): string {
  return 'sub_' + hash(canonical([principal, url, name, args]));
}
export function signingKey(secret: string): Buffer {
  if (!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret)) throw new Error('INVALID_SIGNING_SECRET');
  const encoded = secret.slice(6), key = Buffer.from(encoded, 'base64');
  if (key.length < 24 || key.length > 64 || key.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) throw new Error('INVALID_SIGNING_SECRET');
  return key;
}
export function signedHeaders(id: string, subscription: string, body: string, secrets: string[], now = Date.now()) {
  const timestamp = String(Math.floor(now / 1000));
  return {
    'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': timestamp,
    'X-MCP-Subscription-Id': subscription,
    'webhook-signature': secrets.map(secret => 'v1,' + createHmac('sha256', signingKey(secret)).update(`${id}.${timestamp}.${body}`).digest('base64')).join(' '),
  };
}
/** Bind ciphertext to its row and purpose. Keep the 32-byte key in a secret manager. */
export function seal(value: string, key: Buffer, context: string): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}
export function unseal(value: string, key: Buffer, context: string): string {
  const bytes = Buffer.from(value, 'base64'), decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
}
export interface Principal { userId: string; identityKey: string; scopes: string[] }
export interface OAuthConfig {
  issuer: string; resource: string; clientIds: readonly string[];
  /** Issuer-specific claim, configured by the server, never by token input. */
  clientIdClaim?: 'client_id' | 'azp';
  /** Optional live grant/session check after all cryptographic checks. */
  isTokenActive?: (token: string, clientId: string) => Promise<boolean>;
  /** Resolve ONLY against the configured issuer's pinned JWKS; never JWT jku/x5u. */
  resolveKey(kid: string): Promise<KeyObject>;
  /** Must check current account/grant revocation and map (issuer, client_id, sub). */
  resolveIdentity(claims: { issuer: string; clientId: string; subject: string; tokenId?: string }): Promise<string | null>;
}
export async function authenticate(header: string | undefined, config: OAuthConfig, required: string[], now = Date.now()): Promise<Principal> {
  try {
    if (!header?.startsWith('Bearer ') || header.length > 16384) throw new Error();
    const parts = header.slice(7).split('.');
    if (parts.length !== 3) throw new Error();
    const h = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (h.alg !== 'RS256' || typeof h.kid !== 'string' || h.crit || h.jku || h.x5u) throw new Error();
    const key = await config.resolveKey(h.kid);
    if (!verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, Buffer.from(parts[2], 'base64url'))) throw new Error();
    const c = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const seconds = Math.floor(now / 1000);
    if (c.iss !== config.issuer || !(Array.isArray(c.aud) ? c.aud.includes(config.resource) : c.aud === config.resource)
      || !Number.isFinite(c.exp) || c.exp <= seconds || (c.nbf !== undefined && (!Number.isFinite(c.nbf) || c.nbf > seconds))
      || typeof c.sub !== 'string' || !c.sub) throw new Error();
    const clientId = c[config.clientIdClaim ?? 'client_id'];
    if (typeof clientId !== 'string' || !config.clientIds.includes(clientId)) throw new Error();
    const scopes = typeof c.scope === 'string' ? c.scope.split(' ').filter(Boolean) : [];
    if (!required.every(scope => scopes.includes(scope))) throw new Error();
    if (config.isTokenActive && !await config.isTokenActive(header.slice(7), clientId)) throw new Error();
    const userId = await config.resolveIdentity({ issuer: c.iss, clientId, subject: c.sub, tokenId: c.jti });
    if (!userId) throw new Error();
    return { userId, identityKey: hash(canonical([c.iss, c.client_id, c.sub])), scopes };
  } catch { throw new Error('UNAUTHENTICATED'); }
}
