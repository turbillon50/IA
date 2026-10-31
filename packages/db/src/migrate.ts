import { readFile } from "node:fs/promises";
import type { Database } from "./sql.ts";
import { createHash } from "node:crypto";
export async function migrate(db: Database) {
  const sql = await readFile(
    new URL("../migrations/001_core.sql", import.meta.url),
    "utf8",
  );
  const checksum = createHash("sha256").update(sql).digest("hex");
  await db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(19003001)");
    await tx.query(
      "CREATE TABLE IF NOT EXISTS public.iaapp_schema_migrations (version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const old = (
      await tx.query(
        "SELECT checksum FROM public.iaapp_schema_migrations WHERE version=1",
      )
    ).rows[0];
    if (old) {
      if (old.checksum !== checksum)
        throw new Error("Migration checksum changed");
      return;
    }
    await tx.query(sql);
    await tx.query(
      "INSERT INTO public.iaapp_schema_migrations(version,checksum) VALUES(1,$1)",
      [checksum],
    );
  });
}
