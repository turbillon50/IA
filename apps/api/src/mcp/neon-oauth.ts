import { createPublicKey, type KeyObject } from 'node:crypto';
import type { McpConfig } from './server.ts';
import type { McpRepository } from './ports.ts';
import type { OAuthConfig } from './security.ts';
import type { WebhookPost } from './webhook.ts';

/** Neon Auth JWTs are NOT Neon management API keys or browser session cookies.
 * Configure the exact token issuer/audience observed in the registered auth project.
 * Do not accept a JWKS URL or issuer taken from an incoming token.
 */
export interface NeonMcpOptions {
  issuer: string;
  resource: string;
  jwksUrl: string;
  clientIds: readonly string[];
  metadataUrl: string;
  allowedOrigins: readonly string[];
  encryptionKey: Buffer;
  repository: McpRepository;
  webhookPost: WebhookPost;
  /** Revalidate grant/revocation and map (issuer, clientId, sub) to IAapp user. */
  resolveIdentity: OAuthConfig['resolveIdentity'];
  /** Query IAapp account with server-side permissions; never trust JWT profile fields. */
  resolveProfile(userId: string): Promise<{ userId: string; displayName: string; email?: string } | null>;
  /** Injectable for isolated tests. Production uses HTTPS fetch with timeout. */
  fetchJwks?: (url: string) => Promise<unknown>;
}

function httpsUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw new Error('INVALID_OAUTH_URL');
  return url;
}

export function createNeonMcpConfig(options: NeonMcpOptions): McpConfig {
  const issuer = httpsUrl(options.issuer).toString().replace(/\/$/, '');
  const resource = httpsUrl(options.resource).toString();
  const metadataUrl = httpsUrl(options.metadataUrl).toString();
  const jwksUrl = httpsUrl(options.jwksUrl);
  // Pin discovery to the configured Neon Auth origin; never follow JWT-supplied URLs.
  if (jwksUrl.origin !== new URL(issuer).origin) throw new Error('JWKS_ORIGIN_MISMATCH');
  if (new URL(metadataUrl).origin !== new URL(resource).origin) throw new Error('METADATA_ORIGIN_MISMATCH');
  if (!options.clientIds.length || options.clientIds.some(id => !id.trim())) throw new Error('OAUTH_CLIENT_IDS_REQUIRED');
  const fetchJwks = options.fetchJwks ?? (async (url: string) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('JWKS_UNAVAILABLE');
    const body = await response.text();
    if (body.length > 65536) throw new Error('JWKS_TOO_LARGE');
    return JSON.parse(body) as unknown;
  });
  let cache: { expiresAt: number; keys: Map<string, KeyObject> } | undefined;
  let pending: Promise<Map<string, KeyObject>> | undefined;
  const loadKeys = async (): Promise<Map<string, KeyObject>> => {
    if (cache && cache.expiresAt > Date.now()) return cache.keys;
    if (pending) return pending;
    pending = (async () => {
      const document = await fetchJwks(jwksUrl.toString()) as { keys?: unknown };
      if (!document || !Array.isArray(document.keys) || document.keys.length > 32) throw new Error('INVALID_JWKS');
      const keys = new Map<string, KeyObject>();
      for (const entry of document.keys) {
        if (!entry || typeof entry !== 'object') continue;
        const jwk = entry as Record<string, unknown>;
        if (jwk.kty !== 'RSA' || typeof jwk.kid !== 'string' || !jwk.kid ||
            (jwk.alg && jwk.alg !== 'RS256') || (jwk.use && jwk.use !== 'sig') ||
            (jwk.key_ops && (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes('verify'))) ||
            typeof jwk.n !== 'string' || typeof jwk.e !== 'string' || keys.has(jwk.kid)) continue;
        keys.set(jwk.kid, createPublicKey({ key: jwk as import('node:crypto').JsonWebKey, format: 'jwk' }));
      }
      if (!keys.size) throw new Error('NO_TRUSTED_KEYS');
      cache = { keys, expiresAt: Date.now() + 5 * 60_000 };
      return keys;
    })();
    try { return await pending; } finally { pending = undefined; }
  };
  const oauth: OAuthConfig = {
    issuer, resource, clientIds: [...options.clientIds],
    resolveKey: async kid => {
      let keys = await loadKeys();
      if (!keys.has(kid)) { cache = undefined; keys = await loadKeys(); } // rotation
      const key = keys.get(kid);
      if (!key) throw new Error('UNKNOWN_KEY');
      return key;
    },
    resolveIdentity: options.resolveIdentity,
  };
  return {
    oauth,
    repository: options.repository,
    webhookPost: options.webhookPost,
    encryptionKey: options.encryptionKey,
    metadataUrl,
    allowedOrigins: options.allowedOrigins,
    getAuthorizedProfile: options.resolveProfile,
  };
}
