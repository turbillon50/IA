// Development-only generator. Never connects to a remote database.
import { PGlite } from '@electric-sql/pglite';
import { Kysely, PostgresDialect } from 'kysely';
import { getMigrations } from 'better-auth/db/migration';
import { writeFile } from 'node:fs/promises';
import { createSelfHostedIdentity } from './self-hosted.ts';

const pg = new PGlite();
const client = { query: (sql: string, params?: unknown[]) => pg.query(sql, params), release() {} };
const sql = new Kysely({ dialect: new PostgresDialect({ pool: { connect: async () => client, end: async () => {} } as never }) });
try {
  const own = createSelfHostedIdentity({ baseURL: 'http://localhost:3999',
    secret: 'schema-generator-local-only-1234567890', database: { db: sql, type: 'postgres', schemaName: 'iaapp_auth' },
    db: { transaction: async () => { throw new Error('SCHEMA_GENERATOR_ONLY'); } }, clientIds: [],
  });
  const plan = await getMigrations(own.auth.options);
  const generated = await plan.compileMigrations();
  await writeFile(new URL('../../../../packages/db/migrations/003_self_hosted_auth.sql', import.meta.url),
    '-- Generated from Better Auth + OAuth Provider 1.7.14; regenerate with npm run generate:schema --prefix apps/api/src/auth.\n' +
    'ALTER TABLE iaapp.users ADD COLUMN line_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 100000) UNIQUE;\n' +
    'CREATE SCHEMA IF NOT EXISTS iaapp_auth;\nSET LOCAL search_path = iaapp_auth, public;\n' + generated +
    '\nREVOKE ALL ON SCHEMA iaapp_auth FROM PUBLIC;\nREVOKE ALL ON ALL TABLES IN SCHEMA iaapp_auth FROM PUBLIC;\n' +
    'SET LOCAL search_path = public;\n');
} finally { await sql.destroy(); await pg.close(); }
