import { readUpdates } from "../../../../packages/db/src/updates.ts";
import express, {
  Router,
  type Request as ExpressRequest,
  type Response,
  type NextFunction,
} from "express";
import { randomUUID } from "node:crypto";
import {
  Repository,
  pageLimit,
} from "../../../../packages/db/src/repository.ts";
import { Connections } from "../../../../packages/db/src/connections.ts";
import {
  Files,
  type PrivateStorage,
} from "../../../../packages/db/src/files.ts";
import { DomainError, fail } from "../../../../packages/db/src/sql.ts";
import { IdentityResolver } from "../auth/identity.ts";
import type { AuthAdapter } from "../auth/identity.ts";
import type { Database } from "../../../../packages/db/src/sql.ts";
export interface RestOptions {
  db: Database;
  auth: AuthAdapter;
  storage?: PrivateStorage;
  allowedOrigins: string[];
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function only(body: any, allowed: string[], required: string[] = []) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((k) => !allowed.includes(k)) ||
    required.some((k) => body[k] === undefined)
  )
    fail("VALIDATION_ERROR");
  return body;
}
export function createRestRouter(options: RestOptions) {
  const router = Router();
  const repo = new Repository(options.db);
  const resolver = new IdentityResolver(options.db, options.auth);
  const connections = new Connections(repo);
  const files = options.storage ? new Files(repo, options.storage) : null;
  router.use((req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set("X-Request-Id", res.locals.requestId);
    res.set("Cache-Control", "no-store");
    const origin = req.get("origin");
    if (origin && !options.allowedOrigins.includes(origin))
      return next(new DomainError("FORBIDDEN"));
    if (origin) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
      res.set(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type, Idempotency-Key",
      );
      res.set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  router.use(express.json({ limit: "64kb", strict: true }));
  router.use(async (req, res, next) => {
    try {
      const headers = new Headers();
      if (req.get("cookie")) headers.set("cookie", req.get("cookie")!);
      if (req.get("authorization"))
        headers.set("authorization", req.get("authorization")!);
      const session = await resolver.authenticate(
        new globalThis.Request("https://iaapp.internal/", { headers }),
      );
      res.locals.actor = session.actor;
      res.locals.identity = session.identity;
      next();
    } catch (e) {
      next(e);
    }
  });
  const route = (
    method: "get" | "post" | "patch",
    path: string,
    work: (req: ExpressRequest, res: Response) => Promise<any>,
    fields?: string[],
    required?: string[],
  ) => {
    router[method](path, async (req, res, next) => {
      try {
        for (const [k, v] of Object.entries(req.params)) {
          if (k !== "token" && !uuid.test(String(v))) fail("VALIDATION_ERROR");
        }
        for (const k of ["cursor", "scopeId"])
          if (
            req.query[k] !== undefined &&
            (typeof req.query[k] !== "string" ||
              !uuid.test(req.query[k] as string))
          )
            fail("VALIDATION_ERROR");
        if (fields) only(req.body ?? {}, fields, required);
        const result = await work(req, res);
        res
          .status(method === "post" ? 201 : 200)
          .json({ ...result, requestId: res.locals.requestId });
      } catch (e) {
        next(e);
      }
    });
  };
  const a = (res: Response) => res.locals.actor;
  const param = (req: ExpressRequest, k = "id") => String(req.params[k]);
  const paging = (req: ExpressRequest) => ({
    cursor: req.query.cursor === undefined ? null : String(req.query.cursor),
    limit: pageLimit(req.query.limit),
  });
  route("get", "/me", async (_, res) => repo.me(a(res)));
  route("post", "/bootstrap", async (_req, res) => {
    const identity = res.locals.identity;
    const expected = process.env.IAAPP_BOOTSTRAP_SUBJECT;
    if (!expected || identity.subject !== expected) fail("FORBIDDEN");
    return options.db.transaction(async (tx) => {
      // One founder for this database, even under concurrent requests.
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('iaapp:founder'))");
      const existing = (await tx.query("SELECT id FROM iaapp.workspaces LIMIT 1")).rows[0];
      if (existing) fail("CONFLICT");
      const wid = randomUUID();
      const pid = randomUUID();
      await tx.query("INSERT INTO iaapp.workspaces(id,name) VALUES($1,$2)", [wid, "IAapp"]);
      await tx.query("INSERT INTO iaapp.workspace_members(workspace_id,user_id,role) VALUES($1,$2,'owner')", [wid, a(res).userId]);
      await tx.query("INSERT INTO iaapp.participants(id,workspace_id,kind,user_id,display_name,handle) VALUES($1,$2,'human',$3,$4,$5)", [pid, wid, a(res).userId, identity.displayName.slice(0,200) || 'Luis', `human-${pid}`]);
      return { workspaceId: wid, participantId: pid };
    });
  }, [], []);
  route("get", "/workspaces/:id/participants", async (req, res) => {
    const p = paging(req);
    return repo.participants(a(res), param(req), p.cursor, p.limit);
  });
  route(
    "post",
    "/workspaces/:id/participants/ai",
    async (req, res) => repo.createAI(a(res), param(req), req.body),
    ["displayName", "purpose"],
    ["displayName", "purpose"],
  );
  route(
    "post",
    "/workspaces/:id/invitations",
    async (req, res) =>
      repo.createInvitation(a(res), param(req), req.body.email, req.body.role),
    ["email", "role"],
    ["email", "role"],
  );
  route(
    "post",
    "/invitations/:token/accept",
    async (req, res) => {
      if (param(req, "token").length > 100) fail("VALIDATION_ERROR");
      // Email is supplied only by the verified identity adapter, never the payload.
      const emails = res.locals.identity.verifiedEmails as string[];
      if (!emails.length) fail("FORBIDDEN");
      const invitationEmail = await options.db.transaction(
        async (tx) =>
          (
            await tx.query(
              "SELECT email FROM iaapp.invitations WHERE token_hash=$1",
              [
                (
                  await import("../../../../packages/db/src/repository.ts")
                ).hash(param(req, "token")),
              ],
            )
          ).rows[0]?.email,
      );
      const verified = emails.find((e) => e === invitationEmail);
      if (!verified) return fail("FORBIDDEN");
      return repo.acceptInvitation(a(res), param(req, "token"), verified);
    },
    [],
    [],
  );
  route("get", "/participants/:id/connection", async (req, res) =>
    connections.summary(a(res), param(req)),
  );
  route(
    "post",
    "/participants/:id/pairing",
    async (req, res) => connections.pairing(a(res), param(req)),
    [],
    [],
  );
  route(
    "post",
    "/connections/:id/pause",
    async (req, res) => connections.change(a(res), param(req), "paused"),
    [],
    [],
  );
  route(
    "post",
    "/connections/:id/revoke",
    async (req, res) => connections.change(a(res), param(req), "revoked"),
    [],
    [],
  );
  route("get", "/workspaces/:id/rooms", async (req, res) => {
    const p = paging(req);
    return repo.rooms(a(res), param(req), p.cursor, p.limit);
  });
  route(
    "post",
    "/workspaces/:id/rooms",
    async (req, res) => repo.createRoom(a(res), param(req), req.body),
    ["title", "kind", "participantIds", "projectId"],
    ["title", "kind", "participantIds"],
  );
  route("get", "/rooms/:id/messages", async (req, res) =>
    repo.messages(a(res), param(req), {
      after:
        req.query.after === undefined ? undefined : String(req.query.after),
      before:
        req.query.before === undefined ? undefined : String(req.query.before),
      limit: pageLimit(req.query.limit),
    }),
  );
  route(
    "post",
    "/rooms/:id/messages",
    async (req, res) =>
      repo.sendMessage(
        a(res),
        param(req),
        req.get("idempotency-key") ?? "",
        req.body,
      ),
    ["body", "recipientParticipantIds", "attachmentIds"],
    ["body", "recipientParticipantIds", "attachmentIds"],
  );
  route("get", "/messages/:id/deliveries", async (req, res) => ({
    items: await repo.deliveries(a(res), param(req)),
  }));
  route("get", "/workspaces/:id/projects", async (req, res) => {
    const p = paging(req);
    return repo.projects(a(res), param(req), p.cursor, p.limit);
  });
  route(
    "post",
    "/workspaces/:id/projects",
    async (req, res) => repo.createProject(a(res), param(req), req.body),
    ["title", "goal"],
    ["title", "goal"],
  );
  route("get", "/projects/:id", async (req, res) =>
    repo.project(a(res), param(req)),
  );
  route("get", "/projects/:id/tasks", async (req, res) => {
    const p = paging(req);
    return repo.tasks(a(res), param(req), p.cursor, p.limit);
  });
  route(
    "post",
    "/projects/:id/tasks",
    async (req, res) => repo.createTask(a(res), param(req), req.body),
    ["title", "assignee"],
    ["title"],
  );
  route(
    "patch",
    "/tasks/:id",
    async (req, res) => repo.updateTask(a(res), param(req), req.body),
    ["title", "assignedParticipantId", "status", "version"],
    ["version"],
  );
  route("get", "/memory", async (req, res) => {
    const p = paging(req);
    return repo.memory(
      a(res),
      {
        kind: String(req.query.scopeKind) as "room" | "project",
        id: String(req.query.scopeId),
      },
      req.query.category === undefined ? undefined : String(req.query.category),
      p.cursor,
      p.limit,
    );
  });
  route(
    "post",
    "/memory",
    async (req, res) => {
      only(req.body.scope, ["kind", "id"], ["kind", "id"]);
      return repo.saveMemory(a(res), req.body);
    },
    ["scope", "title", "body", "category", "sourceMessageId"],
    ["scope", "title", "body", "category"],
  );
  route(
    "patch",
    "/memory/:id",
    async (req, res) => repo.updateMemory(a(res), param(req), req.body),
    ["title", "body", "expectedVersion"],
    ["expectedVersion"],
  );
  route("get", "/memory/:id/versions", async (req, res) => ({
    items: await repo.memoryVersions(a(res), param(req)),
  }));
  const storage = () => files ?? fail("CONNECTION_UNAVAILABLE");
  route(
    "post",
    "/rooms/:id/attachments",
    async (req, res) => storage().create(a(res), param(req), req.body),
    ["fileName", "bytes", "contentType"],
    ["fileName", "bytes", "contentType"],
  );
  route(
    "post",
    "/attachments/:id/complete",
    async (req, res) => storage().complete(a(res), param(req)),
    [],
    [],
  );
  route("get", "/attachments/:id/download", async (req, res) =>
    storage().download(a(res), param(req)),
  );
  route("get", "/admin/workspaces/:id/deliveries", async (req, res) => {
    const p = paging(req);
    return repo.adminDeliveries(a(res), param(req), p.cursor, p.limit);
  });
  // Additive routes proposed for integration; canonical contract remains unchanged.
  route(
    "post",
    "/rooms/:id/membership/accept",
    async (req, res) =>
      repo.acceptRoomMembership(a(res), param(req), req.body.participantId),
    ["participantId"],
    ["participantId"],
  );
  route(
    "post",
    "/admin/workspaces/:id/members/:userId/revoke",
    async (req, res) => {
      await repo.revokeWorkspaceMember(
        a(res),
        param(req),
        param(req, "userId"),
      );
      return { revoked: true };
    },
    [],
    [],
  );
  route("get", "/updates", async (req, res) =>
    readUpdates(
      repo,
      a(res),
      {
        kind: String(req.query.scopeKind) as "room" | "project",
        id: String(req.query.scopeId),
      },
      req.query.after === undefined ? "0" : String(req.query.after),
      pageLimit(req.query.limit),
    ),
  );
  router.use((_req, res) =>
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "NOT_FOUND",
        requestId: res.locals.requestId,
      },
    }),
  );
  router.use(
    (error: any, _req: ExpressRequest, res: Response, _next: NextFunction) => {
      const known = error instanceof DomainError;
      const malformed =
        error?.type === "entity.parse.failed" ||
        error?.type === "entity.too.large" ||
        error?.code === "22P02";
      const code = known
        ? error.code
        : malformed
          ? "VALIDATION_ERROR"
          : "RETRYABLE";
      const status = {
        UNAUTHENTICATED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        VALIDATION_ERROR: 400,
        CONFLICT: 409,
        CONNECTION_UNAVAILABLE: 503,
        RETRYABLE: 503,
      }[code as DomainError["code"]];
      res.status(status).json({
        error: { code, message: code, requestId: res.locals.requestId },
      });
    },
  );
  return router;
}

export function createRestApp(options: RestOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api/v1", createRestRouter(options));
  return app;
}
