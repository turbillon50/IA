import { randomBytes, randomUUID } from "node:crypto";
import type { Query } from "./sql.ts";
import { fail } from "./sql.ts";
import {
  Repository,
  verifiedSubscription,
  workspace,
  projectAccess,
  hash,
  text,
  messageDTO,
  deliveryDTO,
  memoryDTO,
  pageLimit,
  type Actor,
} from "./repository.ts";
import type { Message, Delivery } from "../../contracts/domain.ts";
/** Passed ONLY by the MCP OAuth verifier, not REST or model input. The verifier
 * must resolve issuer/client/subject separately from human sessions and enforce scopes. */
export interface VerifiedMcpActor extends Actor {
  kind: "mcp_oauth";
  scopes: readonly string[];
}
export interface OutboxLease {
  outboxId: string;
  deliveryId: string;
  eventId: string;
  leaseToken: string;
  leaseUntil: string;
}
export interface DeliveryPersistence {
  claimOutbox(): Promise<OutboxLease | null>;
  issueReplyCapability(lease: OutboxLease): Promise<{
    replyCapability: string;
    expiresAt: string;
    delivery: Delivery;
    message: Message;
  }>;
  recordHostResult(
    lease: OutboxLease,
    result: { httpStatus: number; retryAt?: string; errorCode?: string },
  ): Promise<void>;
  respond(
    actor: VerifiedMcpActor,
    input: {
      deliveryId: string;
      replyCapability: string;
      body: string;
      idempotencyKey: string;
    },
  ): Promise<Message>;
}
/** No HTTP, Events envelope, subscription callback or OAuth implementation here. */
export class DeliveryRepository implements DeliveryPersistence {
  repo: Repository;
  constructor(repo: Repository) {
    this.repo = repo;
  }
  private async live(
    tx: Query,
    did: string,
    owner?: string,
  ): Promise<Record<string, any>> {
    const d = (
      await tx.query(
        `SELECT d.*,m.room_id,m.workspace_id,m.sender_participant_id FROM iaapp.deliveries d JOIN iaapp.messages m ON m.id=d.message_id WHERE d.id=$1`,
        [did],
      )
    ).rows[0];
    if (!d) fail("NOT_FOUND");
    const p = (
      await tx.query(
        "SELECT * FROM iaapp.participants WHERE id=$1 AND kind='ai'",
        [d.recipient_participant_id],
      )
    ).rows[0];
    if (!p || (owner && p.owner_user_id !== owner)) fail("NOT_FOUND");
    await workspace(tx, { userId: p.owner_user_id }, d.workspace_id);
    const room = (
      await tx.query("SELECT * FROM iaapp.rooms WHERE id=$1", [d.room_id])
    ).rows[0];
    if (room.project_id)
      await projectAccess(tx, { userId: p.owner_user_id }, room.project_id);
    const membership = (
      await tx.query(
        "SELECT * FROM iaapp.room_members WHERE room_id=$1 AND participant_id=$2 AND accepted_at IS NOT NULL AND left_at IS NULL FOR SHARE",
        [d.room_id, p.id],
      )
    ).rows[0];
    if (!membership) fail("NOT_FOUND");
    // A revoked sender cannot leave queued work or a live reply capability behind.
    const sender = (
      await tx.query(
        "SELECT user_id FROM iaapp.participants WHERE id=$1 AND kind='human'",
        [d.sender_participant_id],
      )
    ).rows[0];
    if (!sender) fail("FORBIDDEN");
    await workspace(tx, { userId: sender.user_id }, d.workspace_id);
    const sm = (
      await tx.query(
        "SELECT * FROM iaapp.room_members WHERE room_id=$1 AND participant_id=$2 AND left_at IS NULL AND accepted_at IS NOT NULL FOR SHARE",
        [d.room_id, d.sender_participant_id],
      )
    ).rows[0];
    if (!sm) fail("NOT_FOUND");
    if (room.project_id)
      await projectAccess(tx, { userId: sender.user_id }, room.project_id);
    const c = (
      await tx.query("SELECT * FROM iaapp.connections WHERE id=$1 FOR SHARE", [
        d.connection_id,
      ])
    ).rows[0];
    if (
      !c ||
      c.state !== "ready" ||
      !c.verified_at ||
      c.generation !== d.generation ||
      c.participant_id !== p.id
    )
      fail("CONNECTION_UNAVAILABLE");
    await verifiedSubscription(tx, c.id, c.generation, p.owner_user_id);
    const latest = (
      await tx.query("SELECT * FROM iaapp.deliveries WHERE id=$1 FOR UPDATE", [
        did,
      ])
    ).rows[0];
    if (["cancelled", "expired", "paused"].includes(latest.state))
      fail("CONNECTION_UNAVAILABLE");
    return {
      ...latest,
      room_id: d.room_id,
      workspace_id: d.workspace_id,
      role: membership.role,
    };
  }
  claimOutbox() {
    return this.repo.db.transaction(async (tx) => {
      const o = (
        await tx.query(
          `SELECT o.* FROM iaapp.outbox o JOIN iaapp.deliveries d ON d.id=o.delivery_id WHERE o.completed_at IS NULL AND o.available_at<=now() AND (o.lease_until IS NULL OR o.lease_until<now()) AND d.state IN ('queued','sending') ORDER BY o.available_at,o.id FOR UPDATE OF o SKIP LOCKED LIMIT 1`,
        )
      ).rows[0];
      if (!o) return null;
      const token = randomUUID();
      const until = new Date(Date.now() + 30000).toISOString();
      await tx.query(
        "UPDATE iaapp.outbox SET lease_token=$1,lease_until=$2 WHERE id=$3",
        [token, until, o.id],
      );
      return {
        outboxId: o.id,
        deliveryId: o.delivery_id,
        eventId: o.event_id,
        leaseToken: token,
        leaseUntil: until,
      };
    });
  }
  private async lease(tx: Query, l: OutboxLease, allowCompleted = false) {
    const row = (
      await tx.query(
        "SELECT * FROM iaapp.outbox WHERE id=$1 AND delivery_id=$2 AND event_id=$3 AND lease_token=$4 AND lease_until>now() AND ($5 OR completed_at IS NULL) FOR UPDATE",
        [l.outboxId, l.deliveryId, l.eventId, l.leaseToken, allowCompleted],
      )
    ).rows[0];
    if (!row) fail("CONFLICT");
    return row;
  }
  issueReplyCapability(l: OutboxLease) {
    return this.repo.db.transaction(async (tx) => {
      await this.lease(tx, l);
      const d = await this.live(tx, l.deliveryId);
      if (!["queued", "sending"].includes(d.state)) fail("CONFLICT");
      const raw = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 600000).toISOString();
      await tx.query(
        "INSERT INTO iaapp.reply_capabilities(token_hash,delivery_id,connection_id,generation,participant_id,room_id,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          hash(raw),
          d.id,
          d.connection_id,
          d.generation,
          d.recipient_participant_id,
          d.room_id,
          expiresAt,
        ],
      );
      await tx.query(
        "UPDATE iaapp.deliveries SET state='sending',attempts=attempts+1 WHERE id=$1",
        [d.id],
      );
      const m = (
        await tx.query("SELECT * FROM iaapp.messages WHERE id=$1", [
          d.message_id,
        ])
      ).rows[0];
      return {
        replyCapability: raw,
        expiresAt,
        delivery: deliveryDTO({
          ...d,
          state: "sending",
          attempts: d.attempts + 1,
        }),
        message: messageDTO(m),
      };
    });
  }
  recordHostResult(
    l: OutboxLease,
    result: { httpStatus: number; retryAt?: string; errorCode?: string },
  ) {
    return this.repo.db.transaction(async (tx) => {
      await this.lease(tx, l, true);
      await tx.query(
        "SELECT c.id FROM iaapp.connections c JOIN iaapp.deliveries d ON d.connection_id=c.id WHERE d.id=$1 FOR UPDATE OF c",
        [l.deliveryId],
      );
      const d = (
        await tx.query(
          "SELECT * FROM iaapp.deliveries WHERE id=$1 FOR UPDATE",
          [l.deliveryId],
        )
      ).rows[0];
      if (!d) fail("NOT_FOUND");
      const status = result.httpStatus;
      if (!Number.isInteger(status) || status < 100 || status > 599)
        fail("VALIDATION_ERROR");
      const success = status >= 200 && status < 300;
      const terminal =
        success ||
        [401, 403, 404, 410, 413].includes(status) ||
        d.attempts >= 8;
      // A synchronous tool reply or revocation may precede the callback HTTP response.
      if (!["reply_received", "cancelled", "expired"].includes(d.state))
        await tx.query(
          "UPDATE iaapp.deliveries SET state=$1,received_by_host_at=CASE WHEN $2 THEN now() ELSE received_by_host_at END,last_error_code=$3 WHERE id=$4",
          [
            success
              ? "received_by_host"
              : status === 410
                ? "expired"
                : terminal
                  ? "failed"
                  : "queued",
            success,
            result.errorCode ?? (success ? null : `HTTP_${status}`),
            d.id,
          ],
        );
      await tx.query(
        "INSERT INTO iaapp.delivery_attempts(id,delivery_id,status_code,error_code) VALUES($1,$2,$3,$4)",
        [randomUUID(), d.id, status, result.errorCode ?? null],
      );
      if (status === 410)
        await tx.query(
          "UPDATE iaapp.connections SET state='expired',generation=generation+1 WHERE id=$1 AND generation=$2",
          [d.connection_id, d.generation],
        );
      await tx.query(
        "UPDATE iaapp.outbox SET completed_at=CASE WHEN $1 THEN now() ELSE NULL END,available_at=$2,lease_until=NULL,lease_token=NULL WHERE id=$3",
        [
          terminal ||
            ["reply_received", "cancelled", "expired"].includes(d.state),
          result.retryAt ?? new Date(Date.now() + 30000).toISOString(),
          l.outboxId,
        ],
      );
    });
  }
  respond(
    actor: VerifiedMcpActor,
    input: {
      deliveryId: string;
      replyCapability: string;
      body: string;
      idempotencyKey: string;
    },
  ) {
    return this.repo.db.transaction(async (tx) => {
      if (
        actor.kind !== "mcp_oauth" ||
        !actor.scopes.includes("deliveries:respond")
      )
        fail("FORBIDDEN");
      text(input.body, 32000);
      text(input.idempotencyKey, 200);
      text(input.replyCapability, 200);
      await tx.query(
        "SELECT id FROM iaapp.outbox WHERE delivery_id=$1 FOR UPDATE",
        [input.deliveryId],
      );
      const d = await this.live(tx, input.deliveryId, actor.userId);
      const cap = (
        await tx.query(
          "SELECT * FROM iaapp.reply_capabilities WHERE token_hash=$1 FOR UPDATE",
          [hash(input.replyCapability)],
        )
      ).rows[0];
      if (
        !cap ||
        cap.delivery_id !== d.id ||
        cap.connection_id !== d.connection_id ||
        cap.generation !== d.generation ||
        cap.participant_id !== d.recipient_participant_id ||
        cap.room_id !== d.room_id
      )
        fail("FORBIDDEN");
      const digest = hash(
        JSON.stringify({ deliveryId: d.id, body: input.body }),
      );
      if (cap.consumed_at) {
        if (
          cap.idempotency_key !== input.idempotencyKey ||
          cap.request_hash !== digest ||
          !d.response_message_id
        )
          fail("CONFLICT");
        return messageDTO(
          (
            await tx.query("SELECT * FROM iaapp.messages WHERE id=$1", [
              d.response_message_id,
            ])
          ).rows[0],
        );
      }
      if (new Date(cap.expires_at) <= new Date()) fail("FORBIDDEN");
      if (d.response_message_id) fail("CONFLICT");
      const seq = (
        await tx.query(
          "UPDATE iaapp.rooms SET next_sequence=next_sequence+1 WHERE id=$1 RETURNING next_sequence",
          [d.room_id],
        )
      ).rows[0].next_sequence;
      const mid = randomUUID();
      const m = (
        await tx.query(
          "INSERT INTO iaapp.messages(id,room_id,workspace_id,sender_participant_id,sequence,body,in_reply_to,idempotency_key,request_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
          [
            mid,
            d.room_id,
            d.workspace_id,
            d.recipient_participant_id,
            seq,
            input.body,
            d.message_id,
            `delivery:${d.id}:${input.idempotencyKey}`,
            digest,
          ],
        )
      ).rows[0];
      await tx.query(
        "UPDATE iaapp.reply_capabilities SET consumed_at=now(),request_hash=$1,idempotency_key=$2 WHERE token_hash=$3",
        [digest, input.idempotencyKey, cap.token_hash],
      );
      await tx.query(
        "UPDATE iaapp.deliveries SET state='reply_received',response_message_id=$1 WHERE id=$2",
        [mid, d.id],
      );
      await tx.query(
        "UPDATE iaapp.outbox SET completed_at=now() WHERE delivery_id=$1",
        [d.id],
      );
      // Deliberately no new delivery/outbox: AI replies cannot activate other AIs in v1.
      return messageDTO(m);
    });
  }
  private async bounded(
    tx: Query,
    actor: VerifiedMcpActor,
    input: { deliveryId: string; replyCapability: string },
    scope: string,
  ) {
    if (actor.kind !== "mcp_oauth" || !actor.scopes.includes(scope))
      fail("FORBIDDEN");
    const d = await this.live(tx, input.deliveryId, actor.userId);
    const c = (
      await tx.query(
        "SELECT * FROM iaapp.reply_capabilities WHERE token_hash=$1",
        [hash(input.replyCapability)],
      )
    ).rows[0];
    if (
      !c ||
      c.delivery_id !== d.id ||
      c.connection_id !== d.connection_id ||
      c.generation !== d.generation ||
      c.participant_id !== d.recipient_participant_id ||
      c.room_id !== d.room_id ||
      new Date(c.expires_at) <= new Date()
    )
      fail("FORBIDDEN");
    return d;
  }
  readRoom(
    actor: VerifiedMcpActor,
    input: {
      deliveryId: string;
      replyCapability: string;
      after?: string;
      limit?: number;
    },
  ) {
    return this.repo.db.transaction(async (tx) => {
      const d = await this.bounded(tx, actor, input, "rooms:read");
      const after = input.after ?? "0";
      const limit = pageLimit(input.limit);
      if (!/^\d{1,15}$/.test(after)) fail("VALIDATION_ERROR");
      const rows = (
        await tx.query(
          "SELECT * FROM iaapp.messages WHERE room_id=$1 AND sequence>$2 ORDER BY sequence LIMIT $3",
          [d.room_id, after, limit + 1],
        )
      ).rows;
      return {
        items: rows.slice(0, limit).map(messageDTO),
        nextCursor:
          rows.length > limit ? String(rows[limit - 1].sequence) : null,
      };
    });
  }
  readMemory(
    actor: VerifiedMcpActor,
    input: {
      deliveryId: string;
      replyCapability: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    return this.repo.db.transaction(async (tx) => {
      const d = await this.bounded(tx, actor, input, "memory:read");
      const limit = pageLimit(input.limit);
      const rows = (
        await tx.query(
          "SELECT * FROM iaapp.memory_entries WHERE room_id=$1 AND ($2::uuid IS NULL OR id>$2::uuid) ORDER BY id LIMIT $3",
          [d.room_id, input.cursor ?? null, limit + 1],
        )
      ).rows;
      return {
        items: rows.slice(0, limit).map(memoryDTO),
        nextCursor: rows.length > limit ? String(rows[limit - 1].id) : null,
      };
    });
  }
  /** Tool layer must obtain explicit human request before invoking; source and room
   * are always the delivered human message, never a model-supplied foreign ID. */
  saveAgreement(
    actor: VerifiedMcpActor,
    input: {
      deliveryId: string;
      replyCapability: string;
      title: string;
      body: string;
    },
  ) {
    return this.repo.db.transaction(async (tx) => {
      const d = await this.bounded(tx, actor, input, "memory:write");
      if (d.role !== "editor") fail("FORBIDDEN");
      const row = (
        await tx.query(
          "INSERT INTO iaapp.memory_entries(id,workspace_id,room_id,title,body,category,author_participant_id,source_message_id) VALUES($1,$2,$3,$4,$5,'agreement',$6,$7) RETURNING *",
          [
            randomUUID(),
            d.workspace_id,
            d.room_id,
            text(input.title),
            text(input.body, 32000),
            d.recipient_participant_id,
            d.message_id,
          ],
        )
      ).rows[0];
      await tx.query(
        "INSERT INTO iaapp.memory_versions(entry_id,version,snapshot,changed_by) VALUES($1,$2,$3,$4)",
        [row.id, row.version, JSON.stringify(memoryDTO(row)), actor.userId],
      );
      return memoryDTO(row);
    });
  }
}
