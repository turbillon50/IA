import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { createMailboxStore } from '../../../apps/api/src/mcp/mailbox.ts';
import { migrate } from '../src/migrate.ts';
import { fixture, seedSynthetic } from '../src/seed.ts';
import type { Database, Query } from '../src/sql.ts';

test('ordinary-chat MCP mailbox persists messages, supports cursors/idempotency and isolates owners', async () => {
  const pg = new PGlite();
  const db: Database = {
    transaction: work => pg.transaction(tx => work({
      query: async (sql: string, params?: any[]) =>
        params === undefined ? ((await tx.exec(sql)).at(-1) ?? { rows: [] }) : tx.query(sql, params),
    } as Query)),
  };
  try {
    await migrate(db);
    await seedSynthetic(db);
    const mailbox = createMailboxStore(db);
    const request = { mailbox: 'Chat-B', senderLabel: 'Chat A (declarado)', body: 'SÍ SÍ', idempotencyKey: 'test-001' };
    const first = await mailbox.post(fixture.alice, request);
    assert.equal(first.mailbox, 'chat-b');
    assert.equal(first.duplicate, false);
    assert.equal((await mailbox.post(fixture.alice, request)).duplicate, true);
    await assert.rejects(mailbox.post(fixture.alice, { ...request, body: 'different' }), { code: 'CONFLICT' });
    const view = await mailbox.read(fixture.alice, 'chat-b', '0', 50);
    assert.equal(view.messages.length, 1);
    assert.equal(view.messages[0].body, 'SÍ SÍ');
    assert.equal(view.nextCursor, first.messageId);
    assert.deepEqual((await mailbox.read(fixture.alice, 'chat-b', view.nextCursor, 50)).messages, []);
    assert.equal((await mailbox.read(fixture.bob, 'chat-b', '0', 50)).messages.length, 0);
    assert.deepEqual((await mailbox.list(fixture.bob)).mailboxes, []);
    assert.equal((await mailbox.list(fixture.alice)).mailboxes[0].messageCount, 1);
    for (const invalid of ['../traversal', 'a b', '']) {
      await assert.rejects(mailbox.read(fixture.alice, invalid, '0', 50), { code: 'VALIDATION_ERROR' });
    }
    await assert.rejects(mailbox.read(fixture.alice, 'chat-b', '-1', 50), { code: 'VALIDATION_ERROR' });
  } finally { await pg.close(); }
});
