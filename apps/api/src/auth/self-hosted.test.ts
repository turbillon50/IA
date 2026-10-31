import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { PGlite } from '@electric-sql/pglite';
import { Kysely, PostgresDialect } from 'kysely';
import { createSelfHostedIdentity } from './self-hosted.ts';
import { createSelfHostedApplication } from '../rest/self-hosted.ts';
import { Script } from 'node:vm';
import { migrate } from '../../../../packages/db/src/migrate.ts';
import type { Database, Query } from '../../../../packages/db/src/sql.ts';

test('self-hosted account -> real OAuth code + PKCE -> authorized persistent line; no third-party auth', async () => {
  const pg = new PGlite();
  const db: Database = { transaction: work => pg.transaction(tx => work({
    query: (sql: string, params?: unknown[]) => params === undefined ? tx.exec(sql).then(r => r.at(-1) ?? { rows: [] }) : tx.query(sql, params),
  } as Query)) };
  const client = { query: (sql: string, params?: unknown[]) => pg.query(sql, params), release() {} };
  const sql = new Kysely({ dialect: new PostgresDialect({ pool: {
    connect: async () => client, end: async () => {},
  } as never }) });
  const clients: string[] = [];
  const options = { baseURL: 'http://localhost:3999', secret: 'local-test-secret-only-with-more-than-thirty-two-characters',
    database: { db: sql, type: 'postgres' as const, schemaName: 'iaapp_auth' }, db, clientIds: clients, allowSignUp: true };
  await migrate(db);
  const own = createSelfHostedIdentity(options);
  let server: ReturnType<typeof createServer> | undefined;
  try {
    await own.auth.$context;
    const req = (path: string, body?: object, cookie?: string) => own.auth.handler(new Request(options.baseURL + '/api/auth' + path, {
      method: body ? 'POST' : 'GET', headers: { origin: options.baseURL, ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    const signup = await req('/sign-up/email', { name: 'Alice test', email: 'alice@example.test', password: 'Synthetic-only-2026!' });
    assert.equal(signup.status, 200, await signup.clone().text());
    const cookie = signup.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
    const registered = await own.auth.api.adminCreateOAuthClient({ headers: new Headers({ cookie }), body: {
      client_name: 'IAapp local test', redirect_uris: ['https://client.example.test/callback'],
      token_endpoint_auth_method: 'none', grant_types: ['authorization_code'], scope: 'openid profile iaapp:connect',
      resources: [options.baseURL + '/mcp'],
    } });
    clients.push(registered.client_id);
    let verifier = 'v'.repeat(64);
    const params = new URLSearchParams({ client_id: registered.client_id, redirect_uri: 'https://client.example.test/callback',
      response_type: 'code', scope: 'openid profile iaapp:connect', resource: options.baseURL + '/mcp', state: 'test-state',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    });
    let authorization = await req('/oauth2/authorize?' + params, undefined, cookie);
    // Provider may use JSON redirect responses for its hosted consent page.
    const authorizeBody = await authorization.clone().text();
    let location = authorization.headers.get('location') ?? JSON.parse(authorizeBody).url;
    assert.ok(location, authorizeBody);
    if (new URL(location).pathname === '/auth/consent') {
      const consent = await req('/oauth2/consent', { accept: true, oauth_query: new URL(location).search.slice(1) }, cookie);
      assert.equal(consent.status, 200, await consent.clone().text());
      const approved = await consent.json() as { redirect_uri?: string; url?: string };
      location = approved.url ?? approved.redirect_uri;
    }
    assert.ok(location, 'provider must return the registered redirect');
    const callback = new URL(location);
    assert.equal(callback.origin, 'https://client.example.test');
    assert.equal(callback.searchParams.get('state'), 'test-state');
    let code = callback.searchParams.get('code') ?? ''; assert.ok(code, location);
    const tokenRequest = (verifierValue: string) => own.auth.handler(new Request(options.baseURL + '/api/auth/oauth2/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code,
        client_id: registered.client_id, redirect_uri: 'https://client.example.test/callback', code_verifier: verifierValue, resource: options.baseURL + '/mcp' }),
    }));
    assert.notEqual((await tokenRequest('x'.repeat(64))).status, 200, 'wrong PKCE verifier cannot obtain a token');
    // A failed exchange consumes that code. Begin a fresh authorization, as a real client must.
    verifier = 'z'.repeat(64);
    params.set('code_challenge', createHash('sha256').update(verifier).digest('base64url'));
    params.set('state', 'fresh-state');
    const fresh = await req('/oauth2/authorize?' + params, undefined, cookie);
    const freshBody = await fresh.clone().text();
    const freshUrl = fresh.headers.get('location') ?? JSON.parse(freshBody).url;
    assert.equal(new URL(freshUrl).searchParams.get('state'), 'fresh-state');
    code = new URL(freshUrl).searchParams.get('code') ?? ''; assert.ok(code, freshBody);
    const tokens = await tokenRequest(verifier);
    assert.equal(tokens.status, 200, await tokens.clone().text());
    const { access_token } = await tokens.json() as { access_token: string };
    assert.ok(access_token);
    assert.ok(await own.mcp.oauth.isTokenActive!(access_token, registered.client_id), 'issued token must introspect active');
    assert.notEqual((await tokenRequest(verifier)).status, 200, 'authorization code is single-use');
    server = createSelfHostedApplication(options).app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const endpoint = 'http://127.0.0.1:' + (server.address() as { port: number }).port + '/mcp';
    const profile = async (token?: string, args = {}) => {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_my_profile', arguments: args } }) });
      return { status: response.status, data: await response.json() as any };
    };
    assert.equal((await profile()).status, 401);
    assert.equal((await profile(access_token.slice(0, -10) + 'XXXXXXXXXX')).status, 401);
    const result = await profile(access_token);
    assert.equal(result.status, 200);
    assert.ok(result.data.result, JSON.stringify(result.data));
    const line = JSON.parse(result.data.result.content[0].text);
    assert.equal(line.displayName, 'Alice test'); assert.match(line.lineNumber, /^\d+$/);
    const base = endpoint.slice(0, -4);
    const accountPage = await fetch(base + '/auth/sign-in');
    assert.equal(accountPage.status, 200);
    const html = await accountPage.text();
    assert.match(accountPage.headers.get('content-security-policy')!, /frame-ancestors 'none'/);
    new Script(html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)![1]);
    assert.equal((await fetch(base + '/auth/consent?client_id=attacker')).status, 400);
    const metadata = await fetch(base + '/.well-known/oauth-authorization-server/api/auth');
    assert.equal(metadata.status, 200);
    const discovery = await metadata.json() as any;
    assert.equal(discovery.issuer, own.issuer);
    assert.ok(discovery.code_challenge_methods_supported.includes('S256'));
    assert.equal((await fetch(base + '/auth/profile')).status, 401);
    const pwaProfile = await fetch(base + '/auth/profile', { headers: { cookie } });
    assert.deepEqual(await pwaProfile.json(), line);
    const me = await fetch(base + '/api/v1/me', { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json() as any).user.id, line.userId);
    const closedSignup = await fetch(base + '/api/auth/sign-up/email', { method: 'POST',
      headers: { 'content-type': 'application/json', origin: options.baseURL },
      body: JSON.stringify({ name: 'Uninvited', email: 'third@example.test', password: 'Synthetic-only-2026!' }),
    });
    assert.notEqual(closedSignup.status, 200, 'public signup stays disabled');
    const human = await own.resolver.authenticate(new Request(options.baseURL, { headers: { cookie } }));
    assert.equal(human.actor.userId, line.userId);
    const restarted = createSelfHostedIdentity({ ...options, allowSignUp: false });
    assert.equal((await restarted.resolver.authenticate(new Request(options.baseURL, { headers: { cookie } }))).actor.userId, line.userId);
    assert.deepEqual(await restarted.mcp.getAuthorizedProfile(line.userId), line);
    assert.ok((await profile(access_token, { sender_id: 'somebody-else' })).data.error);
    const bob = await req('/sign-up/email', { name: 'Bob test', email: 'bob@example.test', password: 'Synthetic-only-2026!' });
    const bobCookie = bob.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
    assert.notEqual((await own.resolver.authenticate(new Request(options.baseURL, { headers: { cookie: bobCookie } }))).actor.userId, line.userId);
    await req('/sign-out', {}, cookie);
    assert.equal((await profile(access_token)).status, 401, 'sign-out revokes the bound OAuth session');
    const login = await fetch(base + '/api/auth/sign-in/email', { method: 'POST',
      headers: { 'content-type': 'application/json', origin: options.baseURL },
      body: JSON.stringify({ email: 'alice@example.test', password: 'Synthetic-only-2026!' }),
    });
    assert.equal(login.status, 200, await login.clone().text());
    const newCookie = login.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
    const again = await fetch(base + '/auth/profile', { headers: { cookie: newCookie } });
    assert.deepEqual(await again.json(), line, 'a new HTTP login preserves the same permanent line');
  } finally {
    if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server!.close(() => resolve())); }
    await sql.destroy(); await pg.close();
  }
});
