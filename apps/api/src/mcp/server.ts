import type { IncomingMessage, ServerResponse } from 'node:http';
import type { McpRepository } from './ports.ts';
import { authenticate, canonical, hash, seal, signingKey, subscriptionId, token, type OAuthConfig, type Principal } from './security.ts';
import { verifyCallback, type WebhookPost } from './webhook.ts';

const objectSchema = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const str = { type: 'string', minLength: 1, maxLength: 16384 };
const replyProperties = { deliveryId: str, replyCapability: str, body: str, idempotencyKey: str };
export const eventDefinition = {
  name: 'message.created', description: 'A human-directed message or pairing probe for an authorized IAapp participant.',
  delivery: ['webhook'], inputSchema: objectSchema({ participantId: str }),
  payloadSchema: objectSchema({ deliveryId: str, messageId: str, roomId: str, recipientParticipantId: str, summary: str, replyCapability: str }),
};
const tools = [
  { name: 'get_my_profile', description: 'Identify the authorized IAapp owner, not an official ChatGPT thread identity.', inputSchema: objectSchema({}), annotations: { readOnlyHint: true } },
  { name: 'claim_pairing', description: 'Claim the owner-issued single-use IAapp pairing code.', inputSchema: objectSchema({ code: str }) },
  { name: 'confirm_pairing', description: 'Return the capability of a received pairing probe to demonstrate a real round trip.', inputSchema: objectSchema(replyProperties) },
  { name: 'respond_to_delivery', description: 'Respond once to a human-directed delivery using its bound capability.', inputSchema: objectSchema(replyProperties) },
];
class RpcError extends Error {
  code: number; reason: string;
  constructor(code: number, reason: string) { super(reason); this.code = code; this.reason = reason; }
}
function record(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RpcError(-32602, 'INVALID_PARAMS');
  return value as Record<string, any>;
}
function text(value: unknown, max = 16384): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new RpcError(-32602, 'INVALID_PARAMS');
  return value;
}
function keys(value: Record<string, any>, allowed: string[]) {
  if (Object.keys(value).some(k => !allowed.includes(k))) throw new RpcError(-32602, 'INVALID_PARAMS');
}
interface BaseMcpConfig {
  oauth: OAuthConfig; metadataUrl: string;
  /** Browser origins for human administration are configured separately. */
  allowedOrigins: readonly string[];
}
export type McpConfig = BaseMcpConfig & ({
  mode: 'profile';
  getAuthorizedProfile(userId: string): Promise<{ userId: string; lineNumber: string; displayName: string } | null>;
} | {
  mode?: 'full'; repository: McpRepository; webhookPost: WebhookPost; encryptionKey: Buffer;
});
export function createMcpHandler(config: McpConfig) {
  if (config.mode !== 'profile' && config.encryptionKey.length !== 32) throw new Error('INVALID_ENCRYPTION_KEY');
  const verificationCache = new Map<string, number>();
  const metadata = { resource: config.oauth.resource, authorization_servers: [config.oauth.issuer], scopes_supported: config.mode === 'profile' ? ['iaapp:connect'] : ['iaapp:connect', 'iaapp:respond'] };
  const send = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  return async (req: IncomingMessage, res: ServerResponse) => {
    const path = new URL(req.url ?? '/', 'https://local.invalid').pathname;
    if (req.headers.origin && !config.allowedOrigins.includes(req.headers.origin)) return send(res, 403, { error: 'ORIGIN_DENIED' });
    if (req.method === 'GET' && path === new URL(config.metadataUrl).pathname) return send(res, 200, metadata);
    if (path !== new URL(config.oauth.resource).pathname) return send(res, 404, { error: 'NOT_FOUND' });
    let principal: Principal;
    try { principal = await authenticate(req.headers.authorization, config.oauth, ['iaapp:connect']); }
    catch { res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${config.metadataUrl}", scope="${metadata.scopes_supported.join(' ')}"`); return send(res, 401, { error: 'UNAUTHENTICATED' }); }
    if (req.method === 'GET' || req.method === 'DELETE') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    if (req.method !== 'POST' || !req.headers['content-type']?.startsWith('application/json')) return send(res, 415, { error: 'JSON_REQUIRED' });
    let id: string | number | null = null;
    try {
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 65536) return send(res, 413, { error: 'REQUEST_TOO_LARGE' }); chunks.push(Buffer.from(chunk)); }
      let parsed: unknown;
      try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new RpcError(-32700, 'PARSE_ERROR'); }
      const rpc = record(parsed);
      if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string' || (rpc.id !== undefined && typeof rpc.id !== 'string' && typeof rpc.id !== 'number')) throw new RpcError(-32600, 'INVALID_REQUEST');
      id = rpc.id ?? null;
      if (rpc.id === undefined) {
        if (rpc.method === 'notifications/initialized' || rpc.method === 'notifications/cancelled') return send(res, 202, undefined);
        throw new RpcError(-32600, 'REQUEST_ID_REQUIRED');
      }
      const p = record(rpc.params ?? {});
      let result: unknown;
      switch (rpc.method) {
        case 'initialize': result = { protocolVersion: '2025-03-26', capabilities: config.mode === 'profile' ? { tools: {} } : { tools: {}, events: {} }, serverInfo: { name: 'iaapp', version: '0.1.0' } }; break;
        case 'ping': result = {}; break;
        case 'events/list': result = { events: config.mode === 'profile' ? [] : [eventDefinition] }; break;
        case 'tools/list': result = { tools: config.mode === 'profile' ? tools.filter(t => t.name === 'get_my_profile') : tools }; break;
        case 'events/subscribe':
        case 'events/unsubscribe': {
          if (config.mode === 'profile') throw new RpcError(-32601, 'METHOD_NOT_FOUND');
          keys(p, ['name', 'arguments', 'delivery', 'cursor', 'ttlMs']);
          if (p.name !== 'message.created' || (p.cursor !== undefined && p.cursor !== null)) throw new RpcError(-32602, 'INVALID_EVENT_OR_CURSOR');
          const args = record(p.arguments), delivery = record(p.delivery);
          keys(args, ['participantId']); keys(delivery, ['mode', 'url', 'secret']);
          const participantId = text(args.participantId, 256), url = text(delivery.url, 4096);
          if (delivery.mode !== 'webhook') throw new RpcError(-32602, 'WEBHOOK_REQUIRED');
          const binding = await config.repository.getOwnedBinding(principal, participantId);
          if (!binding || binding.ownerUserId !== principal.userId) throw new RpcError(-32001, 'FORBIDDEN');
          const subId = subscriptionId(principal.identityKey, url, p.name, args);
          if (rpc.method === 'events/unsubscribe') { await config.repository.stopSubscription(principal, subId); result = {}; break; }
          if (!['awaiting_subscription', 'awaiting_probe', 'ready'].includes(binding.state)) throw new RpcError(-32001, 'CONNECTION_UNAVAILABLE');
          const secret = text(delivery.secret, 128); signingKey(secret);
          if (p.ttlMs !== undefined && p.ttlMs !== null && (!Number.isSafeInteger(p.ttlMs) || p.ttlMs <= 0)) throw new RpcError(-32602, 'INVALID_TTL');
          const now = Date.now(), expiresAt = now + Math.min(p.ttlMs ?? 3600000, 86400000);
          const old = await config.repository.getSubscription(subId);
          const cacheKey = hash(canonical([principal.identityKey, url, hash(secret)]));
          if ((verificationCache.get(cacheKey) ?? 0) <= now) {
            try { await verifyCallback(config.webhookPost, subId, url, secret); }
            catch { throw new RpcError(-32015, 'challenge_failed'); }
            for (const [key, expiry] of verificationCache) if (expiry <= now) verificationCache.delete(key);
            if (verificationCache.size >= 1000) verificationCache.clear();
            verificationCache.set(cacheKey, Date.now() + 60000);
          }
          await config.repository.saveSubscription(principal, binding, {
            id: subId, identityKey: principal.identityKey, connectionId: binding.id, generation: binding.generation,
            url, encryptedSecret: seal(secret, config.encryptionKey, subId), expiresAt, verifiedAt: Date.now(),
            ...(old && old.generation === binding.generation && old.expiresAt > now ? { previousEncryptedSecret: old.encryptedSecret, rotationExpiresAt: now + 60000 } : {}),
          });
          result = { id: subId, refreshBefore: new Date(expiresAt).toISOString(), cursor: null, truncated: false }; break;
        }
        case 'tools/call': {
          keys(p, ['name', 'arguments', '_meta']);
          const a = record(p.arguments ?? {}); let value: unknown;
          if (p.name === 'get_my_profile') {
            keys(a, []);
            if (config.mode === 'profile') {
              const profile = await config.getAuthorizedProfile(principal.userId);
              if (!profile || profile.userId !== principal.userId) throw new RpcError(-32001, 'FORBIDDEN');
              value = profile;
            } else value = { userId: principal.userId };
          }
          else if (config.mode === 'profile') throw new RpcError(-32601, 'UNKNOWN_TOOL');
          else if (p.name === 'claim_pairing') {
            keys(a, ['code']); const binding = await config.repository.claimPairing(principal, hash(text(a.code, 128)), Date.now());
            value = { connectionId: binding.id, participantId: binding.participantId, generation: binding.generation, state: binding.state };
          } else if (p.name === 'confirm_pairing' || p.name === 'respond_to_delivery') {
            if (!principal.scopes.includes('iaapp:respond')) throw new RpcError(-32001, 'FORBIDDEN');
            keys(a, Object.keys(replyProperties));
            const deliveryId = text(a.deliveryId, 256), capabilityHash = hash(text(a.replyCapability, 256));
            const body = text(a.body), idempotencyKey = text(a.idempotencyKey, 256);
            value = await config.repository.completeDelivery(principal, { deliveryId, capabilityHash, body, idempotencyKey, requestHash: hash(canonical([p.name, deliveryId, body])), confirmPairing: p.name === 'confirm_pairing', now: Date.now() });
          } else throw new RpcError(-32601, 'UNKNOWN_TOOL');
          result = { content: [{ type: 'text', text: JSON.stringify(value) }], isError: false }; break;
        }
        default: throw new RpcError(-32601, 'METHOD_NOT_FOUND');
      }
      return send(res, 200, { jsonrpc: '2.0', id, result });
    } catch (error) {
      // Never return raw exception text: a network/DB error can contain secrets.
      const safe = error instanceof RpcError ? error : new RpcError(-32603, 'INTERNAL_ERROR');
      return send(res, 200, { jsonrpc: '2.0', id, error: { code: safe.code, message: safe.reason, data: { reason: safe.reason } } });
    }
  };
}
/** Called only from authenticated owner REST, not a model tool. */
export async function createPairing(repository: McpRepository, ownerUserId: string, participantId: string) {
  const code = token(), expiresAt = Date.now() + 600000;
  const result = await repository.createPairing(ownerUserId, participantId, hash(code), expiresAt);
  return { id: result.id, code, expiresAt: new Date(expiresAt).toISOString(), participantId };
}
