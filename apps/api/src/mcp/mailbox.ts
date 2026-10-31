import type { Database } from '../../../../packages/db/src/sql.ts';
import { DomainError } from '../../../../packages/db/src/sql.ts';

/** Shared owner-scoped pull mailbox. A mailbox name is NOT a verified ChatGPT thread ID. */
export interface MailboxPort {
  post(ownerId: string, input: { mailbox: string; senderLabel: string; body: string; idempotencyKey: string }): Promise<{ messageId: string; mailbox: string; duplicate: boolean }>;
  read(ownerId: string, mailbox: string, afterId: string, limit: number): Promise<{ messages: Array<{ id: string; senderLabel: string; body: string; createdAt: string }>; nextCursor: string }>;
  list(ownerId: string): Promise<{ mailboxes: Array<{ mailbox: string; messageCount: number; latestMessageId: string }> }>;
}
export function mailboxName(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/.test(value)) throw new DomainError('VALIDATION_ERROR');
  return value.toLowerCase();
}
export function mailboxText(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new DomainError('VALIDATION_ERROR');
  return value;
}
export function mailboxCursor(value: unknown): string {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,17})$/.test(value)) throw new DomainError('VALIDATION_ERROR');
  return value;
}
export function createMailboxStore(db: Database): MailboxPort {
  return {
    async post(ownerId, input) {
      const mailbox = mailboxName(input.mailbox);
      const sender = mailboxText(input.senderLabel, 80);
      const body = mailboxText(input.body, 8192);
      const key = mailboxText(input.idempotencyKey, 128);
      return db.transaction(async tx => {
        const inserted = await tx.query<{ id: string }>(
          `INSERT INTO iaapp.mcp_mailbox_messages (owner_user_id, mailbox_key, sender_label, body, idempotency_key)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (owner_user_id, mailbox_key, idempotency_key) DO NOTHING RETURNING id::text AS id`,
          [ownerId, mailbox, sender, body, key]);
        if (inserted.rows[0]) return { messageId: inserted.rows[0].id, mailbox, duplicate: false };
        const existing = await tx.query<{ id: string; sender_label: string; body: string }>(
          `SELECT id::text AS id, sender_label, body FROM iaapp.mcp_mailbox_messages
           WHERE owner_user_id = $1 AND mailbox_key = $2 AND idempotency_key = $3`,
          [ownerId, mailbox, key]);
        const found = existing.rows[0];
        if (!found || found.sender_label !== sender || found.body !== body) throw new DomainError('CONFLICT');
        return { messageId: found.id, mailbox, duplicate: true };
      });
    },
    async read(ownerId, mailbox, afterId, limit) {
      const name = mailboxName(mailbox), cursor = mailboxCursor(afterId);
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new DomainError('VALIDATION_ERROR');
      const rows = await db.transaction(tx => tx.query<{ id: string; sender_label: string; body: string; created_at: string }>(
        `SELECT id::text AS id, sender_label, body, created_at::text AS created_at
         FROM iaapp.mcp_mailbox_messages
         WHERE owner_user_id = $1 AND mailbox_key = $2 AND id > $3::bigint
         ORDER BY id ASC LIMIT $4`, [ownerId, name, cursor, limit]));
      const messages = rows.rows.map(row => ({ id: row.id, senderLabel: row.sender_label, body: row.body, createdAt: row.created_at }));
      return { messages, nextCursor: messages.at(-1)?.id ?? cursor };
    },
    async list(ownerId) {
      const result = await db.transaction(tx => tx.query<{ mailbox_key: string; count: string; latest_id: string }>(
        `SELECT mailbox_key, count(*)::text AS count, max(id)::text AS latest_id
         FROM iaapp.mcp_mailbox_messages WHERE owner_user_id = $1
         GROUP BY mailbox_key ORDER BY max(id) DESC LIMIT 100`, [ownerId]));
      return { mailboxes: result.rows.map(row => ({ mailbox: row.mailbox_key, messageCount: Number(row.count), latestMessageId: row.latest_id })) };
    },
  };
}
