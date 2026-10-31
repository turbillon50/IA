import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createApplication } from '../../apps/api/src/application.ts';
import type { McpConfig } from '../../apps/api/src/mcp/server.ts';
import { DomainError } from '../../packages/db/src/sql.ts';

const rest = {
  db: { transaction: async (): Promise<never> => { throw new Error('DB must not be reached before authentication'); } },
  auth: { authenticate: async (): Promise<never> => { throw new DomainError('UNAUTHENTICATED'); } },
  allowedOrigins: ['https://iaapp.example.test'],
};
async function serve(app: ReturnType<typeof createApplication>, fn: (url: string) => Promise<void>) {
  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try { await fn(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
}

test('composition leaves MCP unavailable and protects REST without configured services', async () => {
  await serve(createApplication({ rest }), async url => {
    const health = await fetch(url + '/healthz');
    assert.equal(health.status, 200);
    assert.equal((await health.json()).mcp, 'disabled');
    assert.equal((await fetch(url + '/mcp')).status, 503);
    assert.equal((await fetch(url + '/api/v1/me')).status, 401);
    const denied = await fetch(url + '/api/v1/me', { headers: { Origin: 'https://attacker.example.test' } });
    assert.equal(denied.status, 403);
  });
});

test('composition preserves the raw MCP body and separate OAuth boundary', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const unsupported = async (): Promise<never> => { throw new Error('Test never exercises persistence'); };
  const mcp: McpConfig = {
    oauth: { issuer: 'https://issuer.example.test', resource: 'https://api.example.test/mcp', clientIds: ['registered'], resolveKey: async () => publicKey, resolveIdentity: async () => 'verified-owner' },
    repository: { getOwnedBinding: unsupported, getSubscription: unsupported, createPairing: unsupported, claimPairing: unsupported, saveSubscription: unsupported, stopSubscription: unsupported, setConnectionState: unsupported, completeDelivery: unsupported },
    webhookPost: unsupported, encryptionKey: Buffer.alloc(32, 2),
    metadataUrl: 'https://api.example.test/.well-known/oauth-protected-resource', allowedOrigins: [],
  };
  const claims = { iss: mcp.oauth.issuer, aud: mcp.oauth.resource, client_id: 'registered', sub: 'person', exp: Math.floor(Date.now()/1000)+60, scope: 'iaapp:connect' };
  const body = [{ alg: 'RS256', kid: 'test' }, claims].map(x => Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  const authorization = 'Bearer ' + body + '.' + sign('RSA-SHA256', Buffer.from(body), privateKey).toString('base64url');
  await serve(createApplication({ rest, mcp }), async url => {
    assert.equal((await fetch(url + '/.well-known/oauth-protected-resource')).status, 200);
    assert.equal((await fetch(url + '/mcp', { method: 'POST' })).status, 401);
    const result = await fetch(url + '/mcp', { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'get_my_profile', arguments: {} } }) });
    assert.equal(result.status, 200);
    const rpc = await result.json();
    assert.equal(rpc.id, 7);
    assert.equal(JSON.parse(rpc.result.content[0].text).userId, 'verified-owner');
    // An MCP token is not a human REST session.
    assert.equal((await fetch(url + '/api/v1/me', { headers: { authorization } })).status, 401);
  });
  assert.throws(() => createApplication({ rest, mcp: { ...mcp, oauth: { ...mcp.oauth, resource: 'https://api.example.test/api/v1/mcp' } } }), /MCP_ROUTE_COLLISION/);
});
