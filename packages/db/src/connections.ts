import { randomBytes, randomUUID } from "node:crypto";
import { Repository, workspace, hash, type Actor } from "./repository.ts";
import { fail } from "./sql.ts";
import type { Query } from "./sql.ts";
const dto = (c: any) => ({
  id: c.id,
  participantId: c.participant_id,
  state: c.state,
  generation: c.generation,
  verifiedAt: c.verified_at ? new Date(c.verified_at).toISOString() : null,
  lastErrorCode: c.last_error_code,
});
export class Connections {
  repo: Repository;
  constructor(repo: Repository) {
    this.repo = repo;
  }
  private async own(tx: Query, a: Actor, pid: string) {
    const p = (
      await tx.query(
        "SELECT * FROM iaapp.participants WHERE id=$1 AND kind='ai'",
        [pid],
      )
    ).rows[0];
    if (!p || p.owner_user_id !== a.userId) fail("NOT_FOUND");
    await workspace(tx, a, p.workspace_id);
    return p;
  }
  summary(a: Actor, pid: string) {
    return this.repo.db.transaction(async (tx) => {
      const p = (
        await tx.query(
          "SELECT * FROM iaapp.participants WHERE id=$1 AND kind='ai'",
          [pid],
        )
      ).rows[0];
      if (!p) fail("NOT_FOUND");
      await workspace(tx, a, p.workspace_id);
      const c = (
        await tx.query(
          "SELECT * FROM iaapp.connections WHERE participant_id=$1",
          [pid],
        )
      ).rows[0];
      if (!c) fail("NOT_FOUND");
      return {
        ...dto(c),
        lastErrorCode: p.owner_user_id === a.userId ? c.last_error_code : null,
      };
    });
  }
  pairing(a: Actor, pid: string) {
    return this.repo.db.transaction(async (tx) => {
      await this.own(tx, a, pid);
      const c = (
        await tx.query(
          "UPDATE iaapp.connections SET generation=generation+1,state='awaiting_authorization',verified_at=NULL,last_error_code=NULL WHERE participant_id=$1 RETURNING *",
          [pid],
        )
      ).rows[0];
      if (!c) fail("NOT_FOUND");
      await this.invalidate(tx, c.id);
      await tx.query(
        "UPDATE iaapp.pairing_challenges SET consumed_at=now() WHERE participant_id=$1 AND consumed_at IS NULL",
        [pid],
      );
      const code = randomBytes(24).toString("base64url");
      const challengeId = randomUUID();
      const expiresAt = new Date(Date.now() + 600000).toISOString();
      await tx.query(
        "INSERT INTO iaapp.pairing_challenges(id,participant_id,owner_user_id,code_hash,generation,expires_at) VALUES($1,$2,$3,$4,$5,$6)",
        [challengeId, pid, a.userId, hash(code), c.generation, expiresAt],
      );
      return { id: challengeId, code, expiresAt, participantId: pid };
    });
  }
  private async invalidate(tx: Query, cid: string) {
    await tx.query(
      "UPDATE iaapp.subscriptions SET revoked_at=now() WHERE connection_id=$1 AND revoked_at IS NULL",
      [cid],
    );
    await tx.query(
      "UPDATE iaapp.deliveries SET state='cancelled' WHERE connection_id=$1 AND state NOT IN ('reply_received','cancelled','expired')",
      [cid],
    );
    await tx.query(
      "DELETE FROM iaapp.reply_capabilities WHERE connection_id=$1 AND consumed_at IS NULL",
      [cid],
    );
  }
  change(a: Actor, cid: string, state: "paused" | "revoked") {
    return this.repo.db.transaction(async (tx) => {
      const c = (
        await tx.query("SELECT * FROM iaapp.connections WHERE id=$1", [cid])
      ).rows[0];
      if (!c) fail("NOT_FOUND");
      await this.own(tx, a, c.participant_id);
      const updated = (
        await tx.query(
          "UPDATE iaapp.connections SET state=$1,generation=generation+1,verified_at=NULL WHERE id=$2 RETURNING *",
          [state, cid],
        )
      ).rows[0];
      await this.invalidate(tx, cid);
      return dto(updated);
    });
  }
}
