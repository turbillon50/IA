import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { migrate } from "../src/migrate.ts";
import { Repository } from "../src/repository.ts";
import type { Database, Query } from "../src/sql.ts";
import { fixture as f, seedSynthetic } from "../src/seed.ts";
export async function setup() {
  const pg = new PGlite();
  const db: Database = {
    transaction: (work) =>
      pg.transaction((tx) =>
        work({
          query: async (sql: string, params?: any[]) =>
            params === undefined
              ? ((await tx.exec(sql)).at(-1) ?? { rows: [] })
              : tx.query(sql, params),
        } as Query),
      ),
  };
  await migrate(db);
  await migrate(db);
  await seedSynthetic(db);
  return {
    pg,
    db,
    repo: new Repository(db),
    alice: { userId: f.alice },
    bob: { userId: f.bob },
    eve: { userId: f.eve },
  };
}
test("founder bootstrap accepts only the pinned identity and creates one private workspace", async () => {
  const { createRestApp } = await import("../../../apps/api/src/rest/index.ts");
  const { DomainError } = await import("../src/sql.ts");
  const pg = new PGlite();
  const db: Database = {
    transaction: (work) => pg.transaction((tx) => work({
      query: async (sql: string, params?: any[]) =>
        params === undefined ? ((await tx.exec(sql)).at(-1) ?? { rows: [] }) : tx.query(sql, params),
    } as Query)),
  };
  const previous = process.env.IAAPP_BOOTSTRAP_SUBJECT;
  let server: ReturnType<ReturnType<typeof createRestApp>["listen"]> | undefined;
  try {
    await migrate(db);
    const app = createRestApp({
      db, allowedOrigins: [],
      auth: { async authenticate(req) {
        const subject = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!subject || !["founder", "other"].includes(subject)) throw new DomainError("UNAUTHENTICATED");
        return { kind: "human_session", issuer: "https://issuer.example", clientId: "iaapp-pwa", subject, verifiedEmails: [], displayName: subject };
      } },
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server!.once("listening", resolve));
    const port = (server.address() as { port: number }).port;
    const request = async (subject: string) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/bootstrap`, {
        method: "POST", headers: { authorization: `Bearer ${subject}`, "content-type": "application/json" }, body: "{}",
      });
      return { status: response.status, body: await response.json() as any };
    };
    delete process.env.IAAPP_BOOTSTRAP_SUBJECT;
    assert.equal((await request("founder")).status, 403);
    process.env.IAAPP_BOOTSTRAP_SUBJECT = "founder";
    assert.equal((await request("other")).status, 403);
    const created = await request("founder");
    assert.equal(created.status, 201);
    assert.ok(created.body.workspaceId);
    assert.ok(created.body.participantId);
    assert.equal((await request("founder")).status, 409);
    const rows = await db.transaction(tx => tx.query(
      "SELECT wm.role, p.kind, p.user_id = wm.user_id AS same_user FROM iaapp.workspace_members wm JOIN iaapp.participants p ON p.workspace_id = wm.workspace_id WHERE wm.workspace_id=$1",
      [created.body.workspaceId],
    ));
    assert.equal(rows.rows.length, 1);
    assert.deepEqual([rows.rows[0].role, rows.rows[0].kind, rows.rows[0].same_user], ["owner", "human", true]);
  } finally {
    if (previous === undefined) delete process.env.IAAPP_BOOTSTRAP_SUBJECT;
    else process.env.IAAPP_BOOTSTRAP_SUBJECT = previous;
    if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    await pg.close();
  }
});
const input = (body = "Hello") => ({
  body,
  recipientParticipantIds: [],
  attachmentIds: [],
});
test("room/message persistence, isolation, acceptance, replay conflict and reconnect", async () => {
  const { pg, repo, alice, bob, eve } = await setup();
  try {
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Private",
      kind: "group",
      participantIds: [f.bobParticipant],
    });
    await assert.rejects(repo.messages(bob, room.id), { code: "NOT_FOUND" });
    await repo.acceptRoomMembership(bob, room.id, f.bobParticipant);
    const [a, b] = await Promise.all([
      repo.sendMessage(alice, room.id, "key-1", input()),
      repo.sendMessage(alice, room.id, "key-1", input()),
    ]);
    assert.equal(a.message.id, b.message.id);
    assert.equal(a.message.senderParticipantId, f.aliceParticipant);
    await assert.rejects(
      repo.sendMessage(alice, room.id, "key-1", input("changed")),
      { code: "CONFLICT" },
    );
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        repo.sendMessage(bob, room.id, `b-${i}`, input(`message ${i}`)),
      ),
    );
    const page = await repo.messages(alice, room.id, { limit: 3 });
    assert.equal(page.nextCursor, "3");
    const rest = await repo.messages(alice, room.id, {
      after: page.nextCursor!,
    });
    assert.deepEqual(
      [...page.items, ...rest.items].map((m) => m.sequence),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
    const older = await repo.messages(alice, room.id, {
      before: "9",
      limit: 2,
    });
    assert.deepEqual(
      older.items.map((m) => m.sequence),
      [8, 7],
    );
    await assert.rejects(repo.messages(eve, room.id), { code: "NOT_FOUND" });
    await assert.rejects(repo.deliveries(eve, a.message.id), {
      code: "NOT_FOUND",
    });
    await repo.revokeWorkspaceMember(alice, f.workspace, f.bob);
    await assert.rejects(repo.messages(bob, room.id), { code: "NOT_FOUND" });
    await assert.rejects(
      repo.sendMessage(bob, room.id, "after-revoke", input()),
      { code: "NOT_FOUND" },
    );
  } finally {
    await pg.close();
  }
});
test("transactional outbox, AI consent and unavailable connections roll back", async () => {
  const { pg, db, repo, alice, bob } = await setup();
  try {
    const ai = await repo.createAI(bob, f.workspace, {
      displayName: "Test AI",
      purpose: "synthetic",
    });
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Group",
      kind: "group",
      participantIds: [ai.id],
    });
    const msg = { ...input(), recipientParticipantIds: [ai.id] };
    await assert.rejects(repo.sendMessage(alice, room.id, "ai-1", msg), {
      code: "NOT_FOUND",
    });
    await repo.acceptRoomMembership(bob, room.id, ai.id);
    await assert.rejects(repo.sendMessage(alice, room.id, "ai-1", msg), {
      code: "CONNECTION_UNAVAILABLE",
    });
    assert.equal(
      (await pg.query("SELECT * FROM iaapp.messages")).rows.length,
      0,
    );
    await syntheticReady(db, ai.id);
    const result = await repo.sendMessage(alice, room.id, "ai-1", msg);
    const repeated = await repo.sendMessage(alice, room.id, "ai-1", msg);
    assert.equal(result.message.id, repeated.message.id);
    assert.equal(result.deliveries.length, 1);
    assert.equal((await pg.query("SELECT * FROM iaapp.outbox")).rows.length, 1);
    // Force an outbox failure: the message, delivery and room sequence must all roll back.
    await pg.exec(
      "CREATE FUNCTION iaapp.reject_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$; CREATE TRIGGER reject_outbox BEFORE INSERT ON iaapp.outbox FOR EACH ROW EXECUTE FUNCTION iaapp.reject_outbox();",
    );
    await assert.rejects(repo.sendMessage(alice, room.id, "ai-2", msg));
    assert.equal((await repo.messages(alice, room.id)).items.length, 1);
    await pg.exec("DROP TRIGGER reject_outbox ON iaapp.outbox");
    const next = await repo.sendMessage(alice, room.id, "ai-2", msg);
    assert.equal(next.message.sequence, 2);
    await repo.revokeWorkspaceMember(alice, f.workspace, f.bob);
    assert.ok(
      (
        await pg.query<{ state: string }>("SELECT state FROM iaapp.deliveries")
      ).rows.every((d) => d.state === "cancelled"),
    );
  } finally {
    await pg.close();
  }
});
test("memory versioning, scope origin and private project isolation", async () => {
  const { pg, repo, alice, bob, eve } = await setup();
  try {
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Private",
      kind: "group",
      participantIds: [],
    });
    const m = await repo.sendMessage(alice, room.id, "origin", input());
    const memory = await repo.saveMemory(alice, {
      scope: { kind: "room", id: room.id },
      title: "Agreement",
      body: "A",
      category: "agreement",
      sourceMessageId: m.message.id,
    });
    await assert.rejects(repo.memory(bob, { kind: "room", id: room.id }), {
      code: "NOT_FOUND",
    });
    await assert.rejects(repo.memoryVersions(eve, memory.id), {
      code: "NOT_FOUND",
    });
    const updated = await repo.updateMemory(alice, memory.id, {
      body: "B",
      expectedVersion: 1,
    });
    assert.equal(updated.version, 2);
    await assert.rejects(
      repo.updateMemory(alice, memory.id, { body: "C", expectedVersion: 1 }),
      { code: "CONFLICT" },
    );
    assert.deepEqual(
      (await repo.memoryVersions(alice, memory.id)).map((v) => v.body),
      ["A", "B"],
    );
    const another = await repo.createRoom(alice, f.workspace, {
      title: "Other",
      kind: "group",
      participantIds: [],
    });
    await assert.rejects(
      repo.saveMemory(alice, {
        scope: { kind: "room", id: another.id },
        title: "Leak",
        body: "x",
        category: "decision",
        sourceMessageId: m.message.id,
      }),
      { code: "FORBIDDEN" },
    );
    const project = await repo.createProject(alice, f.workspace, {
      title: "Secret",
      goal: "Test",
    });
    assert.equal((await repo.projects(bob, f.workspace)).items.length, 0);
    await assert.rejects(repo.project(bob, project.id), { code: "NOT_FOUND" });
    const t = await repo.createTask(alice, project.id, { title: "Task" });
    assert.deepEqual((await repo.project(alice, project.id)).summary, {
      roomCount: 0,
      taskCount: 1,
      completedTaskCount: 0,
      memoryCount: 0,
    });
    await assert.rejects(
      repo.updateTask(bob, t.id, { title: "hack", version: 1 }),
      { code: "NOT_FOUND" },
    );
    await repo.updateTask(alice, t.id, { status: "done", version: 1 });
    await assert.rejects(
      repo.updateTask(alice, t.id, { status: "doing", version: 1 }),
      { code: "CONFLICT" },
    );
  } finally {
    await pg.close();
  }
});
test("single-use hashed invitations, verified email, expiry and revoked issuer", async () => {
  const { pg, db, repo, alice, bob, eve } = await setup();
  try {
    const i = await repo.createInvitation(
      alice,
      f.workspace,
      "eve@example.test",
      "member",
    );
    const row = (
      await pg.query<{ token_hash: string }>(
        "SELECT token_hash FROM iaapp.invitations",
      )
    ).rows[0];
    assert.notEqual(row.token_hash, i.token);
    await assert.rejects(
      repo.acceptInvitation(eve, i.token, "other@example.test"),
      { code: "FORBIDDEN" },
    );
    await repo.acceptInvitation(eve, i.token, "eve@example.test");
    await assert.rejects(
      repo.acceptInvitation(eve, i.token, "eve@example.test"),
      { code: "FORBIDDEN" },
    );
    await db.transaction((tx) =>
      tx.query(
        "UPDATE iaapp.workspace_members SET role='admin' WHERE workspace_id=$1 AND user_id=$2",
        [f.workspace, f.bob],
      ),
    );
    const revoked = await repo.createInvitation(
      bob,
      f.workspace,
      "revoked@example.test",
      "member",
    );
    await repo.revokeWorkspaceMember(alice, f.workspace, f.bob);
    await assert.rejects(
      repo.acceptInvitation(eve, revoked.token, "revoked@example.test"),
      { code: "NOT_FOUND" },
    );
    const expired = await repo.createInvitation(
      alice,
      f.workspace,
      "x@example.test",
      "member",
    );
    await pg.exec(
      "UPDATE iaapp.invitations SET expires_at=now()-interval '1 day' WHERE accepted_at IS NULL",
    );
    await assert.rejects(
      repo.acceptInvitation(eve, expired.token, "x@example.test"),
      { code: "FORBIDDEN" },
    );
  } finally {
    await pg.close();
  }
});

test("private files: ownership, inspection, cross-room IDs and revocation", async () => {
  const { Files } = await import("../src/files.ts");
  const { pg, repo, alice, bob, eve } = await setup();
  try {
    const objects = new Map<string, any>();
    const signed: string[] = [];
    const files = new Files(repo, {
      async signUpload(key) {
        signed.push(key);
        return {
          url: `https://storage.example.test/upload/${key}`,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        };
      },
      async inspect(key) {
        return objects.get(key) ?? null;
      },
      async signDownload(key) {
        return {
          url: `https://storage.example.test/private/${key}`,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        };
      },
    });
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Files",
      kind: "group",
      participantIds: [f.bobParticipant],
    });
    await repo.acceptRoomMembership(bob, room.id, f.bobParticipant);
    const upload = await files.create(alice, room.id, {
      fileName: "note.txt",
      bytes: 5,
      contentType: "text/plain",
    });
    await assert.rejects(files.complete(bob, upload.attachment.id), {
      code: "FORBIDDEN",
    });
    await assert.rejects(files.download(eve, upload.attachment.id), {
      code: "NOT_FOUND",
    });
    await assert.rejects(files.complete(alice, upload.attachment.id), {
      code: "VALIDATION_ERROR",
    });
    objects.set(signed[0], {
      bytes: 5,
      detectedContentType: "text/plain",
      scan: "clean",
      immutable: true,
    });
    assert.equal(
      (await files.complete(alice, upload.attachment.id)).state,
      "ready",
    );
    assert.ok((await files.download(bob, upload.attachment.id)).url);
    const other = await repo.createRoom(bob, f.workspace, {
      title: "Other",
      kind: "group",
      participantIds: [],
    });
    await assert.rejects(
      repo.sendMessage(bob, other.id, "cross-file", {
        ...input(),
        attachmentIds: [upload.attachment.id],
      }),
      { code: "NOT_FOUND" },
    );
    const bad = await files.create(alice, room.id, {
      fileName: "bad.txt",
      bytes: 5,
      contentType: "text/plain",
    });
    objects.set(signed[1], {
      bytes: 5,
      detectedContentType: "application/pdf",
      scan: "clean",
      immutable: true,
    });
    assert.equal(
      (await files.complete(alice, bad.attachment.id)).state,
      "rejected",
    );
    await assert.rejects(files.download(alice, bad.attachment.id), {
      code: "CONFLICT",
    });
    await repo.revokeWorkspaceMember(alice, f.workspace, f.bob);
    await assert.rejects(files.download(bob, upload.attachment.id), {
      code: "NOT_FOUND",
    });
  } finally {
    await pg.close();
  }
});

test("MCP persistence: stable event retry, single reply, no loops and revoked capabilities", async () => {
  const { DeliveryRepository } = await import("../src/mcp-persistence.ts");
  const { Connections } = await import("../src/connections.ts");
  const { pg, db, repo, alice, bob } = await setup();
  try {
    const ai = await repo.createAI(bob, f.workspace, {
      displayName: "AI",
      purpose: "Test",
    });
    const room = await repo.createRoom(alice, f.workspace, {
      title: "MCP",
      kind: "group",
      participantIds: [ai.id],
    });
    await repo.acceptRoomMembership(bob, room.id, ai.id);
    await syntheticReady(db, ai.id);
    const sent = await repo.sendMessage(alice, room.id, "mcp-1", {
      ...input(),
      recipientParticipantIds: [ai.id],
    });
    const delivery = new DeliveryRepository(repo);
    const lease = (await delivery.claimOutbox())!;
    const capability = await delivery.issueReplyCapability(lease);
    await delivery.recordHostResult(lease, {
      httpStatus: 503,
      retryAt: new Date(Date.now() - 1000).toISOString(),
    });
    const retry = (await delivery.claimOutbox())!;
    assert.equal(retry.eventId, lease.eventId);
    assert.notEqual(retry.leaseToken, lease.leaseToken);
    await assert.rejects(delivery.issueReplyCapability(lease), {
      code: "CONFLICT",
    });
    await delivery.issueReplyCapability(retry);
    await delivery.recordHostResult(retry, { httpStatus: 204 });
    assert.equal(
      (await repo.deliveries(alice, sent.message.id))[0].state,
      "received_by_host",
    );
    const actor = {
      ...bob,
      kind: "mcp_oauth" as const,
      scopes: ["deliveries:respond"],
    };
    const reply = {
      deliveryId: sent.deliveries[0].id,
      replyCapability: capability.replyCapability,
      body: "Reply",
      idempotencyKey: "reply-1",
    };
    await assert.rejects(
      delivery.respond({ ...actor, userId: f.alice }, reply),
      { code: "NOT_FOUND" },
    );
    const scopedActor = {
      ...actor,
      scopes: [
        "deliveries:respond",
        "rooms:read",
        "memory:read",
        "memory:write",
      ],
    };
    assert.equal(
      (await delivery.readRoom(scopedActor, reply)).items[0].id,
      sent.message.id,
    );
    await assert.rejects(
      delivery.readRoom({ ...scopedActor, userId: f.alice }, reply),
      { code: "NOT_FOUND" },
    );
    const agreement = await delivery.saveAgreement(scopedActor, {
      ...reply,
      title: "Explicit test agreement",
      body: "Synthetic",
    });
    assert.equal(agreement.authorParticipantId, ai.id);
    assert.equal(agreement.sourceMessageId, sent.message.id);
    assert.equal(
      (await delivery.readMemory(scopedActor, reply)).items[0].id,
      agreement.id,
    );
    const a = await delivery.respond(actor, reply);
    const b = await delivery.respond(actor, reply);
    assert.equal(a.id, b.id);
    assert.equal(a.senderParticipantId, ai.id);
    assert.equal(a.inReplyTo, sent.message.id);
    await assert.rejects(
      delivery.respond(actor, { ...reply, body: "changed" }),
      { code: "CONFLICT" },
    );
    assert.equal((await pg.query("SELECT * FROM iaapp.outbox")).rows.length, 1);
    assert.equal(
      (await repo.deliveries(alice, sent.message.id))[0].state,
      "reply_received",
    );
    const second = await repo.sendMessage(alice, room.id, "mcp-2", {
      ...input(),
      recipientParticipantIds: [ai.id],
    });
    const l = (await delivery.claimOutbox())!;
    const c = await delivery.issueReplyCapability(l);
    await new Connections(repo).change(bob, ai.connectionId!, "revoked");
    await assert.rejects(
      delivery.respond(actor, {
        ...reply,
        deliveryId: second.deliveries[0].id,
        replyCapability: c.replyCapability,
      }),
      { code: "CONNECTION_UNAVAILABLE" },
    );
  } finally {
    await pg.close();
  }
});

test("RLS denies direct client reads even after accidental SELECT grants", async () => {
  const { pg, db } = await setup();
  try {
    await pg.exec(
      "CREATE ROLE synthetic_browser NOLOGIN; GRANT USAGE ON SCHEMA iaapp TO synthetic_browser; GRANT SELECT ON ALL TABLES IN SCHEMA iaapp TO synthetic_browser;",
    );
    await db.transaction(async (tx) => {
      await tx.query("SET LOCAL ROLE synthetic_browser");
      for (const table of [
        "users",
        "participants",
        "workspace_members",
        "messages",
        "memory_entries",
        "outbox",
        "subscriptions",
        "attachments",
      ])
        assert.equal(
          (await tx.query(`SELECT * FROM iaapp.${table}`)).rows.length,
          0,
        );
    });
    const rows = (
      await pg.query<{ relname: string; relrowsecurity: boolean }>(
        "SELECT relname,relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='iaapp' AND relkind='r'",
      )
    ).rows;
    assert.equal(rows.length, 24);
    assert.ok(rows.every((r) => r.relrowsecurity));
  } finally {
    await pg.close();
  }
});

test("REST validates server sender, verified identity, envelopes, isolation and idempotency", async () => {
  const { createRestApp } = await import("../../../apps/api/src/rest/index.ts");
  const { DomainError } = await import("../src/sql.ts");
  const { pg, db, alice } = await setup();
  const accounts: Record<string, string> = {
    alice: f.alice,
    bob: f.bob,
    eve: f.eve,
  };
  await db.transaction(async (tx) => {
    for (const [subject, user] of Object.entries(accounts))
      await tx.query(
        "INSERT INTO iaapp.external_identities(user_id,issuer,client_id,subject) VALUES($1,$2,$3,$4)",
        [user, "https://identity.example.test", "pwa", subject],
      );
  });
  const app = createRestApp({
    db,
    allowedOrigins: ["https://app.example.test"],
    auth: {
      async authenticate(req) {
        const sub = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!sub || !accounts[sub]) throw new DomainError("UNAUTHENTICATED");
        return {
          kind: "human_session",
          issuer: "https://identity.example.test",
          clientId: "pwa",
          subject: sub,
          verifiedEmails: [`${sub}@example.test`],
          displayName: sub,
        };
      },
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  const request = async (
    path: string,
    who: string,
    body?: any,
    key?: string,
  ) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/v1${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${who}`,
        "content-type": "application/json",
        ...(key ? { "idempotency-key": key } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: res.status, body: (await res.json()) as any };
  };
  try {
    assert.equal((await request("/me", "missing")).status, 401);
    assert.equal((await request("/me", "alice")).body.user.id, alice.userId);
    const created = await request(`/workspaces/${f.workspace}/rooms`, "alice", {
      title: "API",
      kind: "group",
      participantIds: [],
    });
    assert.equal(created.status, 201);
    assert.ok(created.body.requestId);
    const rid = created.body.id;
    assert.equal(
      (
        await request(
          `/rooms/${rid}/messages`,
          "alice",
          { ...input(), senderParticipantId: f.bobParticipant },
          "forged",
        )
      ).status,
      400,
    );
    assert.equal(
      (await request(`/rooms/${rid}/messages`, "alice", input())).status,
      400,
    );
    const a = await request(`/rooms/${rid}/messages`, "alice", input(), "once");
    const b = await request(`/rooms/${rid}/messages`, "alice", input(), "once");
    assert.equal(a.status, 201);
    assert.equal(a.body.message.id, b.body.message.id);
    assert.equal((await request(`/rooms/${rid}/messages`, "bob")).status, 404);
    assert.equal((await request(`/rooms/${rid}/messages`, "eve")).status, 404);
    assert.equal(
      (await request(`/rooms/${rid}/messages?after=nope`, "alice")).status,
      400,
    );
    assert.equal(
      (await request(`/rooms/${rid}/messages?limit=101`, "alice")).status,
      400,
    );
    const conflict = await request(
      `/rooms/${rid}/messages`,
      "alice",
      input("different"),
      "once",
    );
    assert.equal(conflict.status, 409);
    assert.ok(conflict.body.error.requestId);
    assert.equal(
      (await request(`/rooms/${rid}/messages`, "alice")).body.items.length,
      1,
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    await pg.close();
  }
});

test("identities with equal verified email never merge across subjects or clients", async () => {
  const { IdentityResolver } = await import(
    "../../../apps/api/src/auth/identity.ts"
  );
  const { pg, db } = await setup();
  try {
    const auth = (subject: string, clientId = "pwa") =>
      new IdentityResolver(db, {
        async authenticate() {
          return {
            kind: "human_session",
            issuer: "https://identity.example.test",
            clientId,
            subject,
            verifiedEmails: ["same@example.test"],
            displayName: "Synthetic",
          };
        },
      });
    const req = new Request("https://app.example.test");
    const first = await auth("user_external_one").authenticate(req);
    const replay = await auth("user_external_one").authenticate(req);
    const second = await auth("user_external_two").authenticate(req);
    const otherClient = await auth(
      "user_external_one",
      "different-client",
    ).authenticate(req);
    assert.equal(first.actor.userId, replay.actor.userId);
    assert.notEqual(first.actor.userId, second.actor.userId);
    assert.notEqual(first.actor.userId, otherClient.actor.userId);
    assert.equal(
      (await new Repository(db).me(first.actor)).workspaces.length,
      0,
    );
  } finally {
    await pg.close();
  }
});

test("authorized update cursors survive reconnect and deny revoked clients", async () => {
  const { readUpdates } = await import("../src/updates.ts");
  const { pg, repo, alice, bob, eve } = await setup();
  try {
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Updates",
      kind: "group",
      participantIds: [f.bobParticipant],
    });
    await repo.acceptRoomMembership(bob, room.id, f.bobParticipant);
    const scope = { kind: "room" as const, id: room.id };
    await repo.sendMessage(alice, room.id, "u1", input());
    const first = await readUpdates(repo, bob, scope);
    assert.equal(first.items.length, 1);
    const memory = await repo.saveMemory(alice, {
      scope,
      title: "Decision",
      body: "v1",
      category: "decision",
    });
    await repo.updateMemory(alice, memory.id, {
      body: "v2",
      expectedVersion: 1,
    });
    const after = await readUpdates(repo, bob, scope, first.lastCursor);
    assert.deepEqual(
      after.items.map((e) => [e.resourceKind, e.version]),
      [
        ["memory", 1],
        ["memory", 2],
      ],
    );
    await assert.rejects(readUpdates(repo, eve, scope), { code: "NOT_FOUND" });
    await repo.revokeWorkspaceMember(alice, f.workspace, f.bob);
    await assert.rejects(readUpdates(repo, bob, scope, after.lastCursor), {
      code: "NOT_FOUND",
    });
  } finally {
    await pg.close();
  }
});

test("persisted message and outbox survive a database close/reopen", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const dir = await mkdtemp(resolve(".test-data-"));
  let pg = new PGlite(dir);
  const connect = (): Database => ({
    transaction: (work) =>
      pg.transaction((tx) =>
        work({
          query: async (sql: string, params?: any[]) =>
            params === undefined
              ? ((await tx.exec(sql)).at(-1) ?? { rows: [] })
              : tx.query(sql, params),
        } as Query),
      ),
  });
  try {
    let db = connect();
    await migrate(db);
    await seedSynthetic(db);
    let repo = new Repository(db);
    const alice = { userId: f.alice };
    const ai = await repo.createAI(alice, f.workspace, {
      displayName: "Durable AI",
      purpose: "Synthetic",
    });
    await syntheticReady(db, ai.id);
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Persistent",
      kind: "direct",
      participantIds: [ai.id],
    });
    const sent = await repo.sendMessage(alice, room.id, "persisted", {
      ...input(),
      recipientParticipantIds: [ai.id],
    });
    await pg.close();
    pg = new PGlite(dir);
    db = connect();
    await migrate(db);
    repo = new Repository(db);
    assert.equal(
      (await repo.messages(alice, room.id)).items[0].id,
      sent.message.id,
    );
    assert.equal((await pg.query("SELECT * FROM iaapp.outbox")).rows.length, 1);
    const repeated = await repo.sendMessage(alice, room.id, "persisted", {
      ...input(),
      recipientParticipantIds: [ai.id],
    });
    assert.equal(repeated.message.id, sent.message.id);
  } finally {
    await pg.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("two independent owners cannot access each other's workspace resources", async () => {
  const { randomUUID } = await import("node:crypto");
  const { pg, db, repo, alice, bob, eve } = await setup();
  try {
    const w = randomUUID();
    const bp = randomUUID();
    await db.transaction(async (tx) => {
      await tx.query("INSERT INTO iaapp.workspaces(id,name) VALUES($1,$2)", [
        w,
        "Second private workspace",
      ]);
      await tx.query(
        "INSERT INTO iaapp.workspace_members(workspace_id,user_id,role) VALUES($1,$2,'owner')",
        [w, f.bob],
      );
      await tx.query(
        "INSERT INTO iaapp.participants(id,workspace_id,kind,user_id,display_name,handle) VALUES($1,$2,'human',$3,'Bob','bob')",
        [bp, w, f.bob],
      );
    });
    const room = await repo.createRoom(bob, w, {
      title: "Bob private",
      kind: "group",
      participantIds: [],
    });
    const msg = await repo.sendMessage(
      bob,
      room.id,
      "private",
      input("Private"),
    );
    const project = await repo.createProject(bob, w, {
      title: "Private project",
      goal: "Test",
    });
    const memory = await repo.saveMemory(bob, {
      scope: { kind: "room", id: room.id },
      title: "Private",
      body: "Secret",
      category: "agreement",
    });
    for (const denied of [alice, eve]) {
      await assert.rejects(repo.participants(denied, w), { code: "NOT_FOUND" });
      await assert.rejects(repo.rooms(denied, w), { code: "NOT_FOUND" });
      await assert.rejects(repo.messages(denied, room.id), {
        code: "NOT_FOUND",
      });
      await assert.rejects(repo.deliveries(denied, msg.message.id), {
        code: "NOT_FOUND",
      });
      await assert.rejects(repo.project(denied, project.id), {
        code: "NOT_FOUND",
      });
      await assert.rejects(repo.memoryVersions(denied, memory.id), {
        code: "NOT_FOUND",
      });
    }
  } finally {
    await pg.close();
  }
});

async function syntheticReady(db: Database, pid: string) {
  await db.transaction(async (tx) => {
    const c = (
      await tx.query(
        "UPDATE iaapp.connections SET state='ready',verified_at=now() WHERE participant_id=$1 RETURNING *",
        [pid],
      )
    ).rows[0];
    await tx.query(
      "INSERT INTO iaapp.subscriptions(id,connection_id,generation,owner_user_id,filter,callback_ciphertext,secret_ciphertext,expires_at,verified_at) SELECT $1,$2,$3,owner_user_id,'{}','SYNTHETIC_NOT_A_CALLBACK','SYNTHETIC_NOT_A_SECRET',now()+interval '1 hour',now() FROM iaapp.participants WHERE id=$4",
      [crypto.randomUUID(), c.id, c.generation, pid],
    );
  });
}

test("reader role and expired subscriptions cannot write or activate an AI", async () => {
  const { pg, db, repo, alice, bob } = await setup();
  try {
    const room = await repo.createRoom(alice, f.workspace, {
      title: "Reader",
      kind: "group",
      participantIds: [f.bobParticipant],
    });
    await repo.acceptRoomMembership(bob, room.id, f.bobParticipant);
    await db.transaction((tx) =>
      tx.query(
        "UPDATE iaapp.room_members SET role='reader' WHERE room_id=$1 AND participant_id=$2",
        [room.id, f.bobParticipant],
      ),
    );
    await repo.messages(bob, room.id);
    await assert.rejects(repo.sendMessage(bob, room.id, "blocked", input()), {
      code: "FORBIDDEN",
    });
    await assert.rejects(
      repo.saveMemory(bob, {
        scope: { kind: "room", id: room.id },
        title: "No",
        body: "No",
        category: "agreement",
      }),
      { code: "FORBIDDEN" },
    );
    const ai = await repo.createAI(alice, f.workspace, {
      displayName: "Expired AI",
      purpose: "Synthetic",
    });
    await syntheticReady(db, ai.id);
    const direct = await repo.createRoom(alice, f.workspace, {
      title: "Expired",
      kind: "direct",
      participantIds: [ai.id],
    });
    await db.transaction((tx) =>
      tx.query(
        "UPDATE iaapp.subscriptions SET expires_at=now()-interval '1 second' WHERE connection_id=$1",
        [ai.connectionId],
      ),
    );
    await assert.rejects(
      repo.sendMessage(alice, direct.id, "expired", {
        ...input(),
        recipientParticipantIds: [ai.id],
      }),
      { code: "CONNECTION_UNAVAILABLE" },
    );
  } finally {
    await pg.close();
  }
});
