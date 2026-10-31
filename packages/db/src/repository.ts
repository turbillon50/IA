import { createHash, randomUUID, randomBytes } from "node:crypto";
import type { Database, Query } from "./sql.ts";
import { fail } from "./sql.ts";
import type {
  SendMessageInput,
  MemoryEntry,
  Message,
  Room,
  Participant,
  Project,
  Task,
  Attachment,
  Delivery,
} from "../../contracts/domain.ts";
export type Actor = { userId: string };
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const id = () => randomUUID();
const date = (x: any) => new Date(x).toISOString();
export const messageDTO = (r: any): Message => ({
  id: r.id,
  roomId: r.room_id,
  senderParticipantId: r.sender_participant_id,
  sequence: Number(r.sequence),
  body: r.body,
  createdAt: date(r.created_at),
  inReplyTo: r.in_reply_to,
  attachmentIds: r.attachment_ids,
  recipientParticipantIds: r.recipient_participant_ids,
});
const roomDTO = (r: any): Room => ({
  id: r.id,
  workspaceId: r.workspace_id,
  projectId: r.project_id,
  title: r.title,
  kind: r.kind,
  responsePolicy: r.response_policy,
});
const projectDTO = (r: any): Project => ({
  id: r.id,
  workspaceId: r.workspace_id,
  title: r.title,
  goal: r.goal,
  status: r.status,
});
export const deliveryDTO = (r: any): Delivery => ({
  id: r.id,
  messageId: r.message_id,
  recipientParticipantId: r.recipient_participant_id,
  state: r.state,
  attempts: r.attempts,
  receivedByHostAt: r.received_by_host_at ? date(r.received_by_host_at) : null,
  responseMessageId: r.response_message_id,
  lastErrorCode: r.last_error_code,
});
export const memoryDTO = (r: any): MemoryEntry => ({
  id: r.id,
  workspaceId: r.workspace_id,
  scope: {
    kind: r.room_id ? "room" : "project",
    id: r.room_id ?? r.project_id,
  },
  title: r.title,
  body: r.body,
  category: r.category,
  authorParticipantId: r.author_participant_id,
  sourceMessageId: r.source_message_id,
  version: r.version,
  updatedAt: date(r.updated_at),
});
const taskDTO = (r: any): Task & { version: number } => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  assignedParticipantId: r.assigned_participant_id,
  status: r.status,
  version: r.version,
});
const attachmentDTO = (r: any): Attachment => ({
  id: r.id,
  roomId: r.room_id,
  fileName: r.file_name,
  contentType: r.content_type,
  bytes: Number(r.bytes),
  state: r.state,
});
export const text = (v: unknown, max = 200) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    fail("VALIDATION_ERROR");
  return v as string;
};
export function pageLimit(n: unknown = 50) {
  const v = Number(n);
  if (!Number.isInteger(v) || v < 1 || v > 100) fail("VALIDATION_ERROR");
  return v;
}
function sequence(v: unknown) {
  if (typeof v !== "string" || !/^\d{1,15}$/.test(v)) fail("VALIDATION_ERROR");
  return Number(v);
}
function page<T>(
  rows: any[],
  limit: number,
  map: (r: any) => T,
  cursor: (r: any) => string,
) {
  return {
    items: rows.slice(0, limit).map(map),
    nextCursor: rows.length > limit ? cursor(rows[limit - 1]) : null,
  };
}
export async function workspace(tx: Query, a: Actor, w: string, edit = false) {
  const m = (
    await tx.query(
      "SELECT * FROM iaapp.workspace_members WHERE workspace_id=$1 AND user_id=$2 AND revoked_at IS NULL FOR SHARE",
      [w, a.userId],
    )
  ).rows[0];
  if (!m) fail("NOT_FOUND");
  if (edit && !["owner", "admin"].includes(m.role)) fail("FORBIDDEN");
  return m;
}
export async function projectAccess(
  tx: Query,
  a: Actor,
  p: string,
  edit = false,
) {
  const r = (await tx.query("SELECT * FROM iaapp.projects WHERE id=$1", [p]))
    .rows[0];
  if (!r) fail("NOT_FOUND");
  await workspace(tx, a, r.workspace_id);
  const m = (
    await tx.query(
      "SELECT * FROM iaapp.project_members WHERE project_id=$1 AND user_id=$2 AND revoked_at IS NULL FOR SHARE",
      [p, a.userId],
    )
  ).rows[0];
  if (!m) fail("NOT_FOUND");
  if (edit && m.role !== "editor") fail("FORBIDDEN");
  return r;
}
export async function roomAccess(
  tx: Query,
  a: Actor,
  rid: string,
  edit = false,
): Promise<Record<string, any>> {
  const r = (await tx.query("SELECT * FROM iaapp.rooms WHERE id=$1", [rid]))
    .rows[0];
  if (!r) fail("NOT_FOUND");
  await workspace(tx, a, r.workspace_id);
  if (r.project_id) await projectAccess(tx, a, r.project_id);
  const m = (
    await tx.query(
      `SELECT p.id,rm.role FROM iaapp.room_members rm JOIN iaapp.participants p ON p.id=rm.participant_id WHERE rm.room_id=$1 AND p.user_id=$2 AND p.kind='human' AND rm.left_at IS NULL AND rm.accepted_at IS NOT NULL FOR SHARE OF rm`,
      [rid, a.userId],
    )
  ).rows[0];
  if (!m) fail("NOT_FOUND");
  if (edit && m.role !== "editor") fail("FORBIDDEN");
  return { ...r, senderId: m.id };
}
export async function human(tx: Query, a: Actor, w: string) {
  const r = (
    await tx.query(
      "SELECT id FROM iaapp.participants WHERE workspace_id=$1 AND user_id=$2 AND kind='human'",
      [w, a.userId],
    )
  ).rows[0];
  if (!r) fail("NOT_FOUND");
  return r.id as string;
}
export async function verifiedSubscription(
  tx: Query,
  connectionId: string,
  generation: number,
  owner: string,
) {
  const row = (
    await tx.query(
      "SELECT id FROM iaapp.subscriptions WHERE connection_id=$1 AND generation=$2 AND owner_user_id=$3 AND verified_at IS NOT NULL AND revoked_at IS NULL AND expires_at>now() FOR SHARE",
      [connectionId, generation, owner],
    )
  ).rows[0];
  if (!row) fail("CONNECTION_UNAVAILABLE");
}
export class Repository {
  db: Database;
  constructor(db: Database) {
    this.db = db;
  }
  me(a: Actor) {
    return this.db.transaction(async (tx) => {
      const u = (
        await tx.query("SELECT * FROM iaapp.users WHERE id=$1", [a.userId])
      ).rows[0];
      if (!u) fail("UNAUTHENTICATED");
      const ws = (
        await tx.query(
          "SELECT w.id,w.name,w.visibility FROM iaapp.workspaces w JOIN iaapp.workspace_members m ON m.workspace_id=w.id WHERE m.user_id=$1 AND m.revoked_at IS NULL",
          [a.userId],
        )
      ).rows;
      return {
        user: { id: u.id, displayName: u.display_name, handle: u.handle },
        workspaces: ws,
      };
    });
  }
  participants(a: Actor, w: string, cursor: string | null = null, limit = 50) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w);
      pageLimit(limit);
      const rows = (
        await tx.query(
          `SELECT p.*,c.id AS connection_id FROM iaapp.participants p LEFT JOIN iaapp.connections c ON c.participant_id=p.id WHERE p.workspace_id=$1 AND ($2::uuid IS NULL OR p.id>$2::uuid) ORDER BY p.id LIMIT $3`,
          [w, cursor, limit + 1],
        )
      ).rows;
      return page(
        rows,
        limit,
        (p): Participant =>
          p.kind === "human"
            ? {
                id: p.id,
                workspaceId: w,
                kind: "human",
                userId: p.user_id,
                displayName: p.display_name,
                handle: p.handle,
              }
            : {
                id: p.id,
                workspaceId: w,
                kind: "ai",
                ownerUserId: p.owner_user_id,
                displayName: p.display_name,
                handle: p.handle,
                provider: "chatgpt_work",
                purpose: p.purpose,
                connectionId: p.connection_id,
              },
        (r) => r.id,
      );
    });
  }
  createAI(
    a: Actor,
    w: string,
    input: { displayName: string; purpose: string },
  ) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w);
      const pid = id();
      const p = (
        await tx.query(
          `INSERT INTO iaapp.participants(id,workspace_id,kind,owner_user_id,display_name,handle,purpose,provider) VALUES($1,$2,'ai',$3,$4,$5,$6,'chatgpt_work') RETURNING *`,
          [
            pid,
            w,
            a.userId,
            text(input.displayName),
            `ai-${pid}`,
            text(input.purpose, 2000),
          ],
        )
      ).rows[0];
      const cid = id();
      await tx.query(
        "INSERT INTO iaapp.connections(id,participant_id) VALUES($1,$2)",
        [cid, pid],
      );
      return {
        id: pid,
        workspaceId: w,
        kind: "ai" as const,
        ownerUserId: a.userId,
        displayName: p.display_name,
        handle: p.handle,
        provider: "chatgpt_work" as const,
        purpose: p.purpose,
        connectionId: cid,
      };
    });
  }
  createProject(a: Actor, w: string, input: { title: string; goal: string }) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w);
      const p = (
        await tx.query(
          "INSERT INTO iaapp.projects(id,workspace_id,title,goal) VALUES($1,$2,$3,$4) RETURNING *",
          [id(), w, text(input.title), text(input.goal, 4000)],
        )
      ).rows[0];
      await tx.query(
        "INSERT INTO iaapp.project_members(project_id,user_id,role) VALUES($1,$2,'editor')",
        [p.id, a.userId],
      );
      return projectDTO(p);
    });
  }
  projects(a: Actor, w: string, cursor: string | null = null, limit = 50) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w);
      pageLimit(limit);
      return page(
        (
          await tx.query(
            "SELECT p.* FROM iaapp.projects p JOIN iaapp.project_members m ON m.project_id=p.id WHERE p.workspace_id=$1 AND m.user_id=$2 AND m.revoked_at IS NULL AND ($3::uuid IS NULL OR p.id>$3::uuid) ORDER BY p.id LIMIT $4",
            [w, a.userId, cursor, limit + 1],
          )
        ).rows,
        limit,
        projectDTO,
        (r) => r.id,
      );
    });
  }
  project(a: Actor, p: string) {
    return this.db.transaction(async (tx) =>
      projectDTO(await projectAccess(tx, a, p)),
    );
  }
  createRoom(
    a: Actor,
    w: string,
    input: {
      title: string;
      kind: "direct" | "group";
      participantIds: string[];
      projectId?: string | null;
    },
  ) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w);
      if (input.projectId) {
        const p = await projectAccess(tx, a, input.projectId, true);
        if (p.workspace_id !== w) fail("NOT_FOUND");
      }
      if (
        !["direct", "group"].includes(input.kind) ||
        !Array.isArray(input.participantIds) ||
        input.participantIds.length > 50
      )
        fail("VALIDATION_ERROR");
      const self = await human(tx, a, w);
      const ids = [...new Set([self, ...input.participantIds])];
      const participants = (
        await tx.query(
          "SELECT * FROM iaapp.participants WHERE workspace_id=$1 AND id=ANY($2::uuid[])",
          [w, ids],
        )
      ).rows;
      if (participants.length !== ids.length) fail("NOT_FOUND");
      if (
        input.kind === "direct" &&
        (ids.length !== 2 ||
          participants.filter((p) => p.kind === "ai").length !== 1)
      )
        fail("VALIDATION_ERROR");
      // Other people/AI owners must explicitly accept via acceptRoomMembership; no implied consent.
      const r = (
        await tx.query(
          "INSERT INTO iaapp.rooms(id,workspace_id,project_id,title,kind,response_policy) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [
            id(),
            w,
            input.projectId ?? null,
            text(input.title),
            input.kind,
            input.kind === "direct" ? "direct" : "mentions_only",
          ],
        )
      ).rows[0];
      for (const p of participants) {
        await tx.query(
          "INSERT INTO iaapp.room_members(room_id,participant_id,workspace_id,accepted_at) VALUES($1,$2,$3,CASE WHEN $4 THEN now() ELSE NULL END)",
          [
            r.id,
            p.id,
            w,
            p.user_id === a.userId || p.owner_user_id === a.userId,
          ],
        );
      }
      return roomDTO(r);
    });
  }
  acceptRoomMembership(a: Actor, rid: string, pid: string) {
    return this.db.transaction(async (tx) => {
      const p = (
        await tx.query("SELECT * FROM iaapp.participants WHERE id=$1", [pid])
      ).rows[0];
      if (!p || (p.user_id ?? p.owner_user_id) !== a.userId) fail("NOT_FOUND");
      await workspace(tx, a, p.workspace_id);
      const r = (
        await tx.query(
          "SELECT * FROM iaapp.rooms WHERE id=$1 AND workspace_id=$2",
          [rid, p.workspace_id],
        )
      ).rows[0];
      if (!r) fail("NOT_FOUND");
      if (r.project_id) await projectAccess(tx, a, r.project_id);
      const updated = await tx.query(
        "UPDATE iaapp.room_members SET accepted_at=now() WHERE room_id=$1 AND participant_id=$2 AND left_at IS NULL RETURNING room_id",
        [rid, pid],
      );
      if (!updated.rows.length) fail("NOT_FOUND");
      return roomDTO(r);
    });
  }
  rooms(a: Actor, w: string, cursor: string | null = null, limit = 50) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w);
      pageLimit(limit);
      const rows = (
        await tx.query(
          `SELECT r.* FROM iaapp.rooms r JOIN iaapp.room_members rm ON rm.room_id=r.id JOIN iaapp.participants p ON p.id=rm.participant_id WHERE r.workspace_id=$1 AND p.user_id=$2 AND rm.left_at IS NULL AND rm.accepted_at IS NOT NULL AND (r.project_id IS NULL OR EXISTS(SELECT 1 FROM iaapp.project_members pm WHERE pm.project_id=r.project_id AND pm.user_id=$2 AND pm.revoked_at IS NULL)) AND ($3::uuid IS NULL OR r.id>$3::uuid) ORDER BY r.id LIMIT $4`,
          [w, a.userId, cursor, limit + 1],
        )
      ).rows;
      return page(rows, limit, roomDTO, (r) => r.id);
    });
  }
  messages(
    a: Actor,
    r: string,
    opts: { after?: string; before?: string; limit?: number } = {},
  ) {
    return this.db.transaction(async (tx) => {
      await roomAccess(tx, a, r);
      const limit = pageLimit(opts.limit);
      if (opts.after && opts.before) fail("VALIDATION_ERROR");
      const after = opts.after ? sequence(opts.after) : 0;
      const before = opts.before ? sequence(opts.before) : null;
      const rows = (
        await tx.query(
          `SELECT * FROM iaapp.messages WHERE room_id=$1 AND sequence>$2 AND ($3::bigint IS NULL OR sequence<$3) ORDER BY sequence ${before ? "DESC" : "ASC"} LIMIT $4`,
          [r, after, before, limit + 1],
        )
      ).rows;
      return page(rows, limit, messageDTO, (r) => String(r.sequence));
    });
  }
  sendMessage(a: Actor, rid: string, key: string, input: SendMessageInput) {
    return this.db.transaction(async (tx) => {
      const r = await roomAccess(tx, a, rid, true);
      text(key, 200);
      text(input.body, 32000);
      if (
        !Array.isArray(input.recipientParticipantIds) ||
        !Array.isArray(input.attachmentIds) ||
        input.recipientParticipantIds.length > 50 ||
        input.attachmentIds.length > 10
      )
        fail("VALIDATION_ERROR");
      const recipients = [...new Set(input.recipientParticipantIds)].sort();
      const attachments = [...new Set(input.attachmentIds)].sort();
      const digest = hash(
        JSON.stringify({ body: input.body, recipients, attachments }),
      );
      // Room lock serializes sequence assignment and duplicate detection. ACL locks last through commit.
      await tx.query("SELECT id FROM iaapp.rooms WHERE id=$1 FOR UPDATE", [
        rid,
      ]);
      const old = (
        await tx.query(
          "SELECT * FROM iaapp.messages WHERE room_id=$1 AND sender_participant_id=$2 AND idempotency_key=$3",
          [rid, r.senderId, key],
        )
      ).rows[0];
      if (old) {
        if (old.request_hash !== digest) fail("CONFLICT");
        return {
          message: messageDTO(old),
          deliveries: (
            await tx.query(
              "SELECT * FROM iaapp.deliveries WHERE message_id=$1 ORDER BY id",
              [old.id],
            )
          ).rows.map(deliveryDTO),
        };
      }
      for (const fid of attachments) {
        const f = (
          await tx.query(
            "SELECT id FROM iaapp.attachments WHERE id=$1 AND room_id=$2 AND state='ready'",
            [fid, rid],
          )
        ).rows[0];
        if (!f) fail("NOT_FOUND");
      }
      const targets: Record<string, any>[] = [];
      for (const pid of recipients) {
        const p = (
          await tx.query(
            `SELECT p.*,c.id AS connection_id,c.generation,c.state FROM iaapp.participants p JOIN iaapp.room_members rm ON rm.participant_id=p.id LEFT JOIN iaapp.connections c ON c.participant_id=p.id WHERE rm.room_id=$1 AND p.id=$2 AND rm.left_at IS NULL AND rm.accepted_at IS NOT NULL FOR SHARE OF rm`,
            [rid, pid],
          )
        ).rows[0];
        if (!p) fail("NOT_FOUND");
        const owner = p.kind === "human" ? p.user_id : p.owner_user_id;
        await workspace(tx, { userId: owner }, r.workspace_id);
        if (r.project_id)
          await projectAccess(tx, { userId: owner }, r.project_id);
        if (p.kind === "ai") {
          const c = (
            await tx.query(
              "SELECT * FROM iaapp.connections WHERE id=$1 FOR SHARE",
              [p.connection_id],
            )
          ).rows[0];
          if (!c || c.state !== "ready" || !c.verified_at)
            fail("CONNECTION_UNAVAILABLE");
          await verifiedSubscription(tx, c.id, c.generation, owner);
          targets.push({ ...p, generation: c.generation });
        }
      }
      if (
        r.kind === "direct" &&
        (targets.length !== 1 || recipients.length !== 1)
      )
        fail("VALIDATION_ERROR");
      const seq = (
        await tx.query(
          "UPDATE iaapp.rooms SET next_sequence=next_sequence+1 WHERE id=$1 RETURNING next_sequence",
          [rid],
        )
      ).rows[0].next_sequence;
      const mid = id();
      const m = (
        await tx.query(
          "INSERT INTO iaapp.messages(id,room_id,sender_participant_id,workspace_id,sequence,body,attachment_ids,recipient_participant_ids,idempotency_key,request_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
          [
            mid,
            rid,
            r.senderId,
            r.workspace_id,
            seq,
            input.body,
            attachments,
            recipients,
            key,
            digest,
          ],
        )
      ).rows[0];
      for (const p of targets) {
        const did = id();
        await tx.query(
          "INSERT INTO iaapp.deliveries(id,message_id,recipient_participant_id,connection_id,generation) VALUES($1,$2,$3,$4,$5)",
          [did, mid, p.id, p.connection_id, p.generation],
        );
        await tx.query(
          "INSERT INTO iaapp.outbox(id,delivery_id,event_id) VALUES($1,$2,$3)",
          [id(), did, id()],
        );
      }
      return {
        message: messageDTO(m),
        deliveries: (
          await tx.query(
            "SELECT * FROM iaapp.deliveries WHERE message_id=$1 ORDER BY id",
            [mid],
          )
        ).rows.map(deliveryDTO),
      };
    });
  }
  deliveries(a: Actor, mid: string) {
    return this.db.transaction(async (tx) => {
      const m = (
        await tx.query("SELECT room_id FROM iaapp.messages WHERE id=$1", [mid])
      ).rows[0];
      if (!m) fail("NOT_FOUND");
      await roomAccess(tx, a, m.room_id);
      return (
        await tx.query(
          "SELECT * FROM iaapp.deliveries WHERE message_id=$1 ORDER BY id",
          [mid],
        )
      ).rows.map(deliveryDTO);
    });
  }
  async scope(
    tx: Query,
    a: Actor,
    s: { kind: "room" | "project"; id: string },
    edit = false,
  ) {
    if (s?.kind === "room")
      return (await roomAccess(tx, a, s.id, edit)).workspace_id as string;
    if (s?.kind === "project")
      return (await projectAccess(tx, a, s.id, edit)).workspace_id as string;
    return fail("VALIDATION_ERROR");
  }
  memory(
    a: Actor,
    s: { kind: "room" | "project"; id: string },
    category?: string,
    cursor: string | null = null,
    limit = 50,
  ) {
    return this.db.transaction(async (tx) => {
      await this.scope(tx, a, s);
      pageLimit(limit);
      const field = s.kind === "room" ? "room_id" : "project_id";
      return page(
        (
          await tx.query(
            `SELECT * FROM iaapp.memory_entries WHERE ${field}=$1 AND ($2::text IS NULL OR category=$2) AND ($3::uuid IS NULL OR id>$3::uuid) ORDER BY id LIMIT $4`,
            [s.id, category ?? null, cursor, limit + 1],
          )
        ).rows,
        limit,
        memoryDTO,
        (r) => r.id,
      );
    });
  }
  saveMemory(
    a: Actor,
    input: {
      scope: { kind: "room" | "project"; id: string };
      title: string;
      body: string;
      category: string;
      sourceMessageId?: string;
    },
  ) {
    return this.db.transaction(async (tx) => {
      const w = await this.scope(tx, a, input.scope, true);
      if (!["agreement", "criterion", "decision"].includes(input.category))
        fail("VALIDATION_ERROR");
      if (input.sourceMessageId) {
        const m = (
          await tx.query(
            "SELECT m.room_id,r.project_id FROM iaapp.messages m JOIN iaapp.rooms r ON r.id=m.room_id WHERE m.id=$1",
            [input.sourceMessageId],
          )
        ).rows[0];
        if (!m) fail("NOT_FOUND");
        await roomAccess(tx, a, m.room_id);
        if (
          (input.scope.kind === "room" ? m.room_id : m.project_id) !==
          input.scope.id
        )
          fail("FORBIDDEN");
      }
      const row = (
        await tx.query(
          "INSERT INTO iaapp.memory_entries(id,workspace_id,room_id,project_id,title,body,category,author_participant_id,source_message_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
          [
            id(),
            w,
            input.scope.kind === "room" ? input.scope.id : null,
            input.scope.kind === "project" ? input.scope.id : null,
            text(input.title),
            text(input.body, 32000),
            input.category,
            await human(tx, a, w),
            input.sourceMessageId ?? null,
          ],
        )
      ).rows[0];
      await this.snapshot(tx, a, row);
      return memoryDTO(row);
    });
  }
  private async snapshot(tx: Query, a: Actor, r: any) {
    await tx.query(
      "INSERT INTO iaapp.memory_versions(entry_id,version,snapshot,changed_by) VALUES($1,$2,$3,$4)",
      [r.id, r.version, JSON.stringify(memoryDTO(r)), a.userId],
    );
  }
  updateMemory(
    a: Actor,
    mid: string,
    input: { title?: string; body?: string; expectedVersion: number },
  ) {
    return this.db.transaction(async (tx) => {
      const r = (
        await tx.query("SELECT * FROM iaapp.memory_entries WHERE id=$1", [mid])
      ).rows[0];
      if (!r) fail("NOT_FOUND");
      await this.scope(tx, a, memoryDTO(r).scope, true);
      if (!Number.isInteger(input.expectedVersion)) fail("VALIDATION_ERROR");
      const row = (
        await tx.query(
          "UPDATE iaapp.memory_entries SET title=$1,body=$2,version=version+1,updated_at=now() WHERE id=$3 AND version=$4 RETURNING *",
          [
            input.title === undefined ? r.title : text(input.title),
            input.body === undefined ? r.body : text(input.body, 32000),
            mid,
            input.expectedVersion,
          ],
        )
      ).rows[0];
      if (!row) fail("CONFLICT");
      await this.snapshot(tx, a, row);
      return memoryDTO(row);
    });
  }
  memoryVersions(a: Actor, mid: string) {
    return this.db.transaction(async (tx) => {
      const r = (
        await tx.query("SELECT * FROM iaapp.memory_entries WHERE id=$1", [mid])
      ).rows[0];
      if (!r) fail("NOT_FOUND");
      await this.scope(tx, a, memoryDTO(r).scope);
      return (
        await tx.query(
          "SELECT snapshot FROM iaapp.memory_versions WHERE entry_id=$1 ORDER BY version",
          [mid],
        )
      ).rows.map((r) => r.snapshot);
    });
  }
  tasks(a: Actor, p: string, cursor: string | null = null, limit = 50) {
    return this.db.transaction(async (tx) => {
      await projectAccess(tx, a, p);
      pageLimit(limit);
      return page(
        (
          await tx.query(
            "SELECT * FROM iaapp.tasks WHERE project_id=$1 AND ($2::uuid IS NULL OR id>$2::uuid) ORDER BY id LIMIT $3",
            [p, cursor, limit + 1],
          )
        ).rows,
        limit,
        taskDTO,
        (r) => r.id,
      );
    });
  }
  private async assignee(tx: Query, p: string, aid?: string | null) {
    if (!aid) return;
    const r = (
      await tx.query(
        `SELECT t.id FROM iaapp.participants t JOIN iaapp.projects p ON p.workspace_id=t.workspace_id JOIN iaapp.project_members m ON m.project_id=p.id AND m.user_id=coalesce(t.user_id,t.owner_user_id) JOIN iaapp.workspace_members wm ON wm.workspace_id=p.workspace_id AND wm.user_id=m.user_id WHERE p.id=$1 AND t.id=$2 AND m.revoked_at IS NULL AND wm.revoked_at IS NULL`,
        [p, aid],
      )
    ).rows[0];
    if (!r) fail("NOT_FOUND");
  }
  createTask(
    a: Actor,
    p: string,
    input: { title: string; assignee?: string | null },
  ) {
    return this.db.transaction(async (tx) => {
      await projectAccess(tx, a, p, true);
      await this.assignee(tx, p, input.assignee);
      return taskDTO(
        (
          await tx.query(
            "INSERT INTO iaapp.tasks(id,project_id,title,assigned_participant_id) VALUES($1,$2,$3,$4) RETURNING *",
            [id(), p, text(input.title), input.assignee ?? null],
          )
        ).rows[0],
      );
    });
  }
  updateTask(
    a: Actor,
    tid: string,
    input: {
      title?: string;
      assignedParticipantId?: string | null;
      status?: string;
      version: number;
    },
  ) {
    return this.db.transaction(async (tx) => {
      const t = (await tx.query("SELECT * FROM iaapp.tasks WHERE id=$1", [tid]))
        .rows[0];
      if (!t) fail("NOT_FOUND");
      await projectAccess(tx, a, t.project_id, true);
      if (
        !Number.isInteger(input.version) ||
        (input.status && !["todo", "doing", "done"].includes(input.status))
      )
        fail("VALIDATION_ERROR");
      await this.assignee(tx, t.project_id, input.assignedParticipantId);
      const r = (
        await tx.query(
          "UPDATE iaapp.tasks SET title=$1,assigned_participant_id=$2,status=$3,version=version+1 WHERE id=$4 AND version=$5 RETURNING *",
          [
            input.title === undefined ? t.title : text(input.title),
            input.assignedParticipantId === undefined
              ? t.assigned_participant_id
              : input.assignedParticipantId,
            input.status ?? t.status,
            tid,
            input.version,
          ],
        )
      ).rows[0];
      if (!r) fail("CONFLICT");
      return taskDTO(r);
    });
  }
  createInvitation(a: Actor, w: string, email: string, role: string) {
    return this.db.transaction(async (tx) => {
      const m = await workspace(tx, a, w, true);
      if (
        !["admin", "member"].includes(role) ||
        (role === "admin" && m.role !== "owner")
      )
        fail("FORBIDDEN");
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 320
      )
        fail("VALIDATION_ERROR");
      const token = randomBytes(32).toString("base64url");
      const iid = id();
      await tx.query(
        "INSERT INTO iaapp.invitations(id,workspace_id,token_hash,email,role,created_by,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '48 hours')",
        [iid, w, hash(token), email.toLowerCase(), role, a.userId],
      );
      return { id: iid, token };
    });
  }
  acceptInvitation(a: Actor, token: string, verifiedEmail: string) {
    return this.db.transaction(async (tx) => {
      const i = (
        await tx.query(
          "SELECT * FROM iaapp.invitations WHERE token_hash=$1 FOR UPDATE",
          [hash(token)],
        )
      ).rows[0];
      if (
        !i ||
        i.accepted_at ||
        new Date(i.expires_at) <= new Date() ||
        i.email !== verifiedEmail.toLowerCase()
      )
        fail("FORBIDDEN");
      // Creator must still hold authority; a revoked admin cannot leave usable invitations.
      const creator = await workspace(
        tx,
        { userId: i.created_by },
        i.workspace_id,
        true,
      );
      if (i.role === "admin" && creator.role !== "owner") fail("FORBIDDEN");
      const old = (
        await tx.query(
          "SELECT * FROM iaapp.workspace_members WHERE workspace_id=$1 AND user_id=$2",
          [i.workspace_id, a.userId],
        )
      ).rows[0];
      if (old) fail("CONFLICT");
      await tx.query(
        "INSERT INTO iaapp.workspace_members(workspace_id,user_id,role) VALUES($1,$2,$3)",
        [i.workspace_id, a.userId, i.role],
      );
      const u = (
        await tx.query("SELECT * FROM iaapp.users WHERE id=$1", [a.userId])
      ).rows[0];
      if (!u) fail("UNAUTHENTICATED");
      await tx.query(
        "INSERT INTO iaapp.participants(id,workspace_id,kind,user_id,display_name,handle) VALUES($1,$2,'human',$3,$4,$5)",
        [id(), i.workspace_id, a.userId, u.display_name, `human-${a.userId}`],
      );
      await tx.query(
        "UPDATE iaapp.invitations SET accepted_at=now(),accepted_by=$1 WHERE id=$2",
        [a.userId, i.id],
      );
      return { workspaceId: i.workspace_id, role: i.role };
    });
  }
  revokeWorkspaceMember(a: Actor, w: string, user: string) {
    return this.db.transaction(async (tx) => {
      const actor = await workspace(tx, a, w, true);
      if (user === a.userId) fail("FORBIDDEN");
      const target = (
        await tx.query(
          "SELECT * FROM iaapp.workspace_members WHERE workspace_id=$1 AND user_id=$2 FOR UPDATE",
          [w, user],
        )
      ).rows[0];
      if (
        !target ||
        target.role === "owner" ||
        (target.role === "admin" && actor.role !== "owner")
      )
        fail("FORBIDDEN");
      await tx.query(
        "UPDATE iaapp.workspace_members SET revoked_at=now() WHERE workspace_id=$1 AND user_id=$2",
        [w, user],
      );
      await tx.query(
        `UPDATE iaapp.room_members SET left_at=now() WHERE workspace_id=$1 AND participant_id IN(SELECT id FROM iaapp.participants WHERE user_id=$2 OR owner_user_id=$2)`,
        [w, user],
      );
      await tx.query(
        `UPDATE iaapp.deliveries SET state='cancelled' WHERE state NOT IN ('reply_received','cancelled','expired') AND (recipient_participant_id IN(SELECT id FROM iaapp.participants WHERE workspace_id=$1 AND owner_user_id=$2) OR message_id IN(SELECT m.id FROM iaapp.messages m JOIN iaapp.participants p ON p.id=m.sender_participant_id WHERE m.workspace_id=$1 AND p.user_id=$2))`,
        [w, user],
      );
      await tx.query(
        "INSERT INTO iaapp.audit_events(id,actor_user_id,resource_id,action) VALUES($1,$2,$3,$4)",
        [id(), a.userId, w, "workspace.member.revoked"],
      );
    });
  }
  adminDeliveries(
    a: Actor,
    w: string,
    cursor: string | null = null,
    limit = 50,
  ) {
    return this.db.transaction(async (tx) => {
      await workspace(tx, a, w, true);
      pageLimit(limit);
      return page(
        (
          await tx.query(
            `SELECT d.* FROM iaapp.deliveries d JOIN iaapp.messages m ON m.id=d.message_id JOIN iaapp.room_members rm ON rm.room_id=m.room_id JOIN iaapp.participants p ON p.id=rm.participant_id WHERE m.workspace_id=$1 AND p.user_id=$2 AND rm.left_at IS NULL AND rm.accepted_at IS NOT NULL AND (NOT EXISTS(SELECT 1 FROM iaapp.rooms r WHERE r.id=m.room_id AND r.project_id IS NOT NULL) OR EXISTS(SELECT 1 FROM iaapp.rooms r JOIN iaapp.project_members pm ON pm.project_id=r.project_id WHERE r.id=m.room_id AND pm.user_id=$2 AND pm.revoked_at IS NULL)) AND ($3::uuid IS NULL OR d.id>$3::uuid) ORDER BY d.id LIMIT $4`,
            [w, a.userId, cursor, limit + 1],
          )
        ).rows,
        limit,
        deliveryDTO,
        (r) => r.id,
      );
    });
  }
}
export { attachmentDTO };
