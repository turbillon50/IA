import { randomUUID } from "node:crypto";
import type { Database } from "../../../../packages/db/src/sql.ts";
import { fail } from "../../../../packages/db/src/sql.ts";
/** Trusted adapter output only. Never construct from a request body/header claims. */
export interface HumanIdentity {
  kind: "human_session";
  issuer: string;
  clientId: string;
  subject: string;
  verifiedEmails: string[];
  displayName: string;
}
export interface AuthAdapter {
  authenticate(request: Request): Promise<HumanIdentity>;
}
export class IdentityResolver {
  db: Database;
  adapter: AuthAdapter;
  constructor(db: Database, adapter: AuthAdapter) {
    this.db = db;
    this.adapter = adapter;
  }
  async authenticate(request: Request) {
    const identity = await this.adapter.authenticate(request);
    if (
      identity.kind !== "human_session" ||
      !identity.subject ||
      !identity.issuer ||
      !identity.clientId
    )
      fail("UNAUTHENTICATED");
    const userId = await this.db.transaction(async (tx) => {
      // Serializes first-login without ever linking two external accounts by email.
      await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        JSON.stringify([identity.issuer, identity.clientId, identity.subject]),
      ]);
      const existing = (
        await tx.query(
          "SELECT user_id FROM iaapp.external_identities WHERE issuer=$1 AND client_id=$2 AND subject=$3",
          [identity.issuer, identity.clientId, identity.subject],
        )
      ).rows[0];
      if (existing) return existing.user_id as string;
      const uid = randomUUID();
      await tx.query(
        "INSERT INTO iaapp.users(id,display_name,handle) VALUES($1,$2,$3)",
        [uid, identity.displayName.slice(0, 200) || "Invitado", `user-${uid}`],
      );
      await tx.query(
        "INSERT INTO iaapp.external_identities(user_id,issuer,client_id,subject) VALUES($1,$2,$3,$4)",
        [uid, identity.issuer, identity.clientId, identity.subject],
      );
      return uid;
    });
    return { actor: { userId }, identity };
  }
}
