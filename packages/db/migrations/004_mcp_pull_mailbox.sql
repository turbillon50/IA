-- An owner-scoped pull mailbox for MCP tools in ordinary ChatGPT chats.
-- This does not grant access to, identify or wake native ChatGPT conversations.
CREATE TABLE iaapp.mcp_mailbox_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES iaapp.users(id) ON DELETE CASCADE,
  mailbox_key varchar(64) NOT NULL,
  sender_label varchar(80) NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 8192),
  idempotency_key varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, mailbox_key, idempotency_key)
);
CREATE INDEX mcp_mailbox_read_idx
  ON iaapp.mcp_mailbox_messages (owner_user_id, mailbox_key, id);
