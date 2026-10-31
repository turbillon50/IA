import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createMcpHandler } from './server.ts';
import { createNeonMcpConfig } from './neon-oauth.ts';
import type { McpRepository } from './ports.ts';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const issuer = 'https://auth.neon.example.test';
const resource = 'https://iaapp.example.test/mcp';
const key = { ...publicKey.export({ format: 'jwk' }), kid: 'neon-test-key', alg: 'RS256', use: 'sig' };
function bearer(patch: Record<string, unknown> = {}) {
  const claims = { iss: issuer, aud: resource, sub: 'neon-sub-1', client_id: 'iaapp-work', exp: Math.floor(Date.now() / 1000) + 600, scope: 'iaapp:connect', ...patch };
  const parts = [{ alg: 'RS256', kid: 'neon-test-key', typ: 'JWT' }, claims].map(v => Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
  return 'Bearer ' + parts + '.' + sign('RSA-SHA256', Buffer.from(parts), privateKey).toString('base64url');
}

test('Neon MCP: metadata public; no token denied; signed authorized token returns account profile', async () => {
  let jwksCalls = 0, profileCalls = 0;
  const repository = {} as McpRepository; // get_my_profile must not use DB repository stubs
  const config = createNeonMcpConfig({
    issuer, resource, jwksUrl: issuer + '/.well-known/jwks.json',
    metadataUrl: 'https://iaapp.example.test/.well-known/oauth-protected-resource',
    clientIds: ['iaapp-work'], allowedOrigins: [], repository,
    webhookPost: async () => ({ status: 200, body: '{}' }),
    encryptionKey: Buffer.alloc(32, 1),
    fetchJwks: async () => { jwksCalls++; return { keys: [key] }; },
    resolveIdentity: async ({ issuer: tokenIssuer, clientId, subject }) =>
      tokenIssuer === issuer && clientId === 'iaapp-work' && subject === 'neon-sub-1' ? 'user-1' : null,
    resolveProfile: async userId => { profileCalls++; return userId === 'user-1' ? { userId, displayName: 'Cuenta de prueba' } : null; },
  });
  const server = createServer(createMcpHandler(config));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_my_profile', arguments: {} } });
  const request = async (authorization?: string) => {
    const response = await fetch(base + '/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorization ? { authorization } : {}) }, body });
    return { status: response.status, data: await response.json() as any };
  };
  try {
    const metadata = await fetch(base + '/.well-known/oauth-protected-resource');
    assert.equal(metadata.status, 200);
    assert.deepEqual(await metadata.json(), { resource, authorization_servers: [issuer], scopes_supported: ['iaapp:connect', 'iaapp:respond'] });
    assert.equal((await request()).status, 401);
    assert.equal(profileCalls, 0);
    const valid = await request(bearer());
    assert.equal(valid.status, 200);
    assert.equal(valid.data.result.isError, false);
    assert.deepEqual(JSON.parse(valid.data.result.content[0].text), { userId: 'user-1', displayName: 'Cuenta de prueba' });
    assert.equal(profileCalls, 1);
    for (const altered of [bearer({ iss: 'https://evil.example.test' }), bearer({ aud: 'https://other.example.test/mcp' }), bearer({ sub: 'unknown' }), bearer({ exp: 1 }), bearer().slice(0, -8) + 'aaaaaaaa']) {
      assert.equal((await request(altered)).status, 401);
    }
    assert.equal(profileCalls, 1);
    assert.ok(jwksCalls >= 1);
  } finally { server.close(); server.closeAllConnections(); await once(server, 'close'); }
});

test('Neon MCP rejects unpinned JWKS origins and unregistered OAuth clients', () => {
  const base = {
    issuer, resource, jwksUrl: issuer + '/jwks', metadataUrl: 'https://iaapp.example.test/.well-known/oauth-protected-resource',
    clientIds: ['iaapp-work'], allowedOrigins: [], repository: {} as McpRepository,
    webhookPost: async () => ({ status: 200, body: '{}' }), encryptionKey: Buffer.alloc(32, 1),
    resolveIdentity: async () => 'user-1', resolveProfile: async () => null,
  };
  assert.throws(() => createNeonMcpConfig({ ...base, jwksUrl: 'https://evil.example.test/jwks' }), /JWKS_ORIGIN_MISMATCH/);
  assert.throws(() => createNeonMcpConfig({ ...base, clientIds: [] }), /OAUTH_CLIENT_IDS_REQUIRED/);
});
