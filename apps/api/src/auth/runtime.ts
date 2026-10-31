import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { postgres } from '../../../../packages/db/src/sql.ts';
import { createSelfHostedIdentity } from './self-hosted.ts';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}
/** Reuse the existing Postgres service. Auth tables occupy a private schema. */
export function selfHostedRuntimeOptions(provisioning = false) {
  const connectionString = required('IAAPP_DATABASE_URL');
  const db = postgres(connectionString);
  const pool = new pg.Pool({ connectionString, max: 5 });
  const sql = new Kysely({ dialect: new PostgresDialect({ pool }) });
  const options = {
    baseURL: required('IAAPP_PUBLIC_ORIGIN'), secret: required('IAAPP_AUTH_SECRET'),
    database: { db: sql, type: 'postgres' as const, schemaName: 'iaapp_auth' }, db,
    // An empty list keeps MCP closed while the human account login is brought online.
    clientIds: provisioning ? [] : (process.env.IAAPP_OAUTH_CLIENT_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean),
    allowSignUp: provisioning,
    enableMailbox: !provisioning && process.env.IAAPP_MAILBOX_ENABLED === 'true',
  };
  return { options, close: async () => { await sql.destroy(); await db.close(); } };
}

// Explicit, offline provisioning only. This process exposes no registration HTTP port.
if (process.argv[2] === 'provision') {
  const runtime = selfHostedRuntimeOptions(true);
  try {
    const own = createSelfHostedIdentity(runtime.options);
    const email = required('IAAPP_PROVISION_EMAIL'), password = required('IAAPP_PROVISION_PASSWORD');
    const name = required('IAAPP_PROVISION_NAME');
    const redirect = new URL(required('IAAPP_OAUTH_REDIRECT_URI'));
    if (redirect.protocol !== 'https:' || redirect.username || redirect.password || redirect.hash) throw new Error('INVALID_REDIRECT_URI');
    const response = await own.auth.api.signUpEmail({ body: { email, password, name }, asResponse: true });
    if (!response.ok) throw new Error('ACCOUNT_PROVISION_FAILED');
    const cookie = response.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
    const client = await own.auth.api.adminCreateOAuthClient({ headers: new Headers({ cookie }), body: {
      client_name: 'IAapp ChatGPT connection', redirect_uris: [redirect.href], token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'], scope: 'openid profile iaapp:connect', resources: [own.mcp.oauth.resource],
    } });
    const line = await own.resolver.authenticate(new Request(own.origin, { headers: { cookie } }));
    console.log(JSON.stringify({ userId: line.actor.userId, clientId: client.client_id }));
    await own.auth.api.signOut({ headers: new Headers({ cookie }) });
  } finally { await runtime.close(); }
}
