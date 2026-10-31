import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { authenticate, canonical, hash, seal, unseal, signedHeaders, subscriptionId, type OAuthConfig } from './security.ts';
import { publicAddress, verifyCallback, createWebhookPost } from './webhook.ts';
import { createMcpHandler } from './server.ts';
import type { McpRepository } from './ports.ts';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const config: OAuthConfig = {
  issuer: 'https://auth.example.test', resource: 'https://api.example.test/mcp', clientIds: ['registered-chatgpt'],
  resolveKey: async kid => { assert.equal(kid, 'trusted-key'); return publicKey; },
  resolveIdentity: async c => c.subject === 'owner-a' ? 'user-a' : null,
};
const claims = () => ({ iss: config.issuer, aud: config.resource, client_id: 'registered-chatgpt', sub: 'owner-a', exp: Math.floor(Date.now() / 1000) + 600, scope: 'iaapp:connect iaapp:respond' });
function jwt(c = claims(), h = { alg: 'RS256', kid: 'trusted-key' }) {
  const body = [h, c].map(x => Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  return 'Bearer ' + body + '.' + sign('RSA-SHA256', Buffer.from(body), privateKey).toString('base64url');
}
const secret = 'whsec_' + Buffer.alloc(32, 7).toString('base64');
test('OAuth validates signed issuer, audience, expiry, client, scopes and current identity', async () => {
  assert.equal((await authenticate(jwt(), config, ['iaapp:respond'])).userId, 'user-a');
  for (const patch of [{ iss: 'attacker' }, { aud: 'another-resource' }, { exp: 0 }, { nbf: 9999999999 }, { sub: 'owner-b' }, { client_id: 'other-client' }, { scope: 'iaapp:connect' }]) {
    await assert.rejects(authenticate(jwt({ ...claims(), ...patch }), config, ['iaapp:respond']), /UNAUTHENTICATED/);
  }
  await assert.rejects(authenticate(jwt().slice(0, -10), config, []), /UNAUTHENTICATED/);
  await assert.rejects(authenticate(jwt(claims(), { alg: 'none', kid: 'trusted-key' }), config, []), /UNAUTHENTICATED/);
  await assert.rejects(authenticate(jwt(), { ...config, resolveIdentity: async () => null }, []), /UNAUTHENTICATED/);
});
test('subscription identity is canonical and bound to principal and callback', () => {
  const a = subscriptionId('a', 'https://host/cb', 'message.created', { x: 1, y: 2 });
  assert.equal(a, subscriptionId('a', 'https://host/cb', 'message.created', { y: 2, x: 1 }));
  assert.notEqual(a, subscriptionId('b', 'https://host/cb', 'message.created', { x: 1, y: 2 }));
  assert.equal(canonical({ z: { b: 2, a: 1 } }), '{"z":{"a":1,"b":2}}');
});
test('Standard Webhooks HMAC matches exact bytes and supports rotation', () => {
  const body = '{"eventId":"evt-a"}';
  const h = signedHeaders('evt-a', 'sub-a', body, [secret, secret], 1700000000000);
  const expected = createHmac('sha256', Buffer.alloc(32, 7)).update('evt-a.1700000000.' + body).digest('base64');
  assert.equal(h['webhook-signature'], `v1,${expected} v1,${expected}`);
  assert.equal(h['X-MCP-Subscription-Id'], 'sub-a');
  assert.throws(() => signedHeaders('x', 'y', body, ['whsec_eA==']), /INVALID_SIGNING_SECRET/);
});
test('ciphertext is bound to row context and detects tampering', () => {
  const key = Buffer.alloc(32, 9), ciphertext = seal('sensitive', key, 'row-a');
  assert.equal(unseal(ciphertext, key, 'row-a'), 'sensitive');
  assert.throws(() => unseal(ciphertext, key, 'row-b'));
  assert.throws(() => unseal(ciphertext, Buffer.alloc(32, 8), 'row-a'));
});
test('callback verification requires matching echo as well as 2xx', async () => {
  let challenge = '';
  await verifyCallback(async (_url, headers, body) => {
    const value = JSON.parse(body); challenge = value.challenge;
    assert.equal(value.type, 'verification'); assert.ok(headers['webhook-signature']);
    return { status: 200, body: JSON.stringify({ challenge }) };
  }, 'sub-a', 'https://host/cb', secret);
  assert.ok(challenge.length >= 40);
  for (const response of [{ status: 200, body: '{}' }, { status: 200, body: JSON.stringify({ challenge }) }, { status: 302, body: '{}' }]) {
    await assert.rejects(verifyCallback(async () => response, 'sub-a', 'https://host/cb', secret), /CALLBACK_CHALLENGE_FAILED/);
  }
});
test('SSRF denies private, metadata, documentation and transition addresses', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.0.1', '100.64.0.1', '198.18.0.1', '192.0.2.1', '203.0.113.1', '224.0.0.1', '::1', '::ffff:8.8.8.8', 'fc00::1', 'fe80::1', '2002:0808:0808::1', '2001:db8::1', '2001::1']) assert.equal(publicAddress(ip), false, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) assert.equal(publicAddress(ip), true, ip);
  const post = createWebhookPost(['host.example.test']);
  for (const url of ['http://host.example.test/cb', 'https://evil.example.test/cb', 'https://127.0.0.1/cb', 'https://user:pass@host.example.test/cb', 'https://host.example.test:444/cb']) await assert.rejects(post(url, {}, '{}'), /CALLBACK_DESTINATION_DENIED/);
});
test('HTTP endpoint authenticates before dispatch, protects model arguments and callback error details', async () => {
  const calls: any[] = [];
  // Deliberately fail any unconfigured repository method. This is not persistence.
  const repository = new Proxy({}, { get: (_target, key) => async (...args: unknown[]) => {
    calls.push([key, ...args]);
    if (key === 'completeDelivery') return { messageId: 'reply-a', deliveryId: 'delivery-a' };
    if (key === 'getOwnedBinding') return { id: 'binding-a', ownerUserId: 'user-a', participantId: 'ai-a', generation: 1, state: 'awaiting_subscription' };
    if (key === 'getSubscription') return null;
    throw new Error('PRIVATE_DATABASE_ERROR');
  } }) as McpRepository;
  const server = createServer(createMcpHandler({ oauth: config, repository, encryptionKey: Buffer.alloc(32, 1), metadataUrl: 'https://api.example.test/.well-known/oauth-protected-resource', allowedOrigins: [], webhookPost: async () => ({ status: 200, body: '{}' }) }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = (server.address() as any).port, url = `http://127.0.0.1:${port}`;
  const rpc = async (method: string, params = {}, authorization = jwt()) => {
    const response = await fetch(url + '/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    return { status: response.status, body: await response.json() as any };
  };
  try {
    assert.equal((await rpc('events/list', {}, 'Bearer invalid')).status, 401);
    assert.equal(calls.length, 0);
    const metadata = await (await fetch(url + '/.well-known/oauth-protected-resource')).json() as any;
    assert.equal(metadata.resource, config.resource);
    assert.deepEqual((await rpc('initialize')).body.result.capabilities, { tools: {}, events: {} });
    assert.equal((await rpc('events/list')).body.result.events[0].name, 'message.created');
    const args = { deliveryId: 'delivery-a', replyCapability: 'random-capability', body: 'reply', idempotencyKey: 'key-a' };
    assert.equal((await rpc('tools/call', { name: 'respond_to_delivery', arguments: { ...args, participantId: 'impostor' } })).body.error.code, -32602);
    assert.equal((await rpc('tools/call', { name: 'respond_to_delivery', arguments: args })).body.result.isError, false);
    assert.equal(calls.at(-1)[2].capabilityHash, hash('random-capability'));
    assert.equal(calls.at(-1)[1].userId, 'user-a');
    const response = await rpc('events/subscribe', { name: 'message.created', arguments: { participantId: 'ai-a' }, delivery: { mode: 'webhook', url: 'https://host/cb', secret } });
    assert.equal(response.body.error.code, -32015);
    assert.ok(!calls.some(x => x[0] === 'saveSubscription'));
    assert.equal((await rpc('tools/call', { name: 'claim_pairing', arguments: { code: 'code-a' } })).body.error.message, 'INTERNAL_ERROR');
  } finally { server.close(); server.closeAllConnections(); await once(server, 'close'); }
});
