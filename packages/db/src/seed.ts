/** Synthetic fixture only; never run against production. No automatic workspace signup. */
import type { Database } from "./sql.ts";
export const fixture = {
  alice: "00000000-0000-4000-8000-000000000001",
  bob: "00000000-0000-4000-8000-000000000002",
  eve: "00000000-0000-4000-8000-000000000003",
  workspace: "00000000-0000-4000-8000-000000000010",
  aliceParticipant: "00000000-0000-4000-8000-000000000011",
  bobParticipant: "00000000-0000-4000-8000-000000000012",
};
export async function seedSynthetic(db: Database) {
  await db.transaction(async (tx) => {
    for (const [uid, name] of [
      [fixture.alice, "Alice"],
      [fixture.bob, "Bob"],
      [fixture.eve, "Eve"],
    ])
      await tx.query(
        "INSERT INTO iaapp.users(id,display_name,handle) VALUES($1,$2,$2)",
        [uid, name],
      );
    await tx.query("INSERT INTO iaapp.workspaces(id,name) VALUES($1,$2)", [
      fixture.workspace,
      "Synthetic pilot",
    ]);
    for (const [uid, role, pid] of [
      [fixture.alice, "owner", fixture.aliceParticipant],
      [fixture.bob, "member", fixture.bobParticipant],
    ]) {
      await tx.query(
        "INSERT INTO iaapp.workspace_members(workspace_id,user_id,role) VALUES($1,$2,$3)",
        [fixture.workspace, uid, role],
      );
      await tx.query(
        "INSERT INTO iaapp.participants(id,workspace_id,kind,user_id,display_name,handle) VALUES($1,$2,'human',$3,$4,$4)",
        [pid, fixture.workspace, uid, uid === fixture.alice ? "Alice" : "Bob"],
      );
    }
  });
}
