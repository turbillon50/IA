import { Repository, pageLimit, type Actor } from "./repository.ts";
import { fail } from "./sql.ts";
export interface AuthorizedUpdate {
  sequence: number;
  resourceKind: "message" | "memory" | "task" | "attachment";
  resourceId: string;
  version: number;
}
/** Pull-based private updates. No content in notifications, no long-lived ACL cache.
 * Realtime may only be enabled later after its channel revocation test passes. */
export function readUpdates(
  repo: Repository,
  a: Actor,
  scope: { kind: "room" | "project"; id: string },
  after = "0",
  limit = 50,
) {
  return repo.db.transaction(async (tx) => {
    await repo.scope(tx, a, scope);
    pageLimit(limit);
    if (!/^\d{1,15}$/.test(after)) fail("VALIDATION_ERROR");
    const field = scope.kind === "room" ? "room_id" : "project_id";
    const rows = (
      await tx.query(
        `SELECT * FROM iaapp.change_events WHERE ${field}=$1 AND sequence>$2 ORDER BY sequence LIMIT $3`,
        [scope.id, after, limit + 1],
      )
    ).rows;
    return {
      items: rows
        .slice(0, limit)
        .map(
          (r): AuthorizedUpdate => ({
            sequence: Number(r.sequence),
            resourceKind: r.resource_kind,
            resourceId: r.resource_id,
            version: r.version,
          }),
        ),
      nextCursor: rows.length > limit ? String(rows[limit - 1].sequence) : null,
      lastCursor: rows.length
        ? String(rows[Math.min(rows.length, limit) - 1].sequence)
        : after,
    };
  });
}
