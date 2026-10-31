import { readFile } from "node:fs/promises";
import type { Database } from "./sql.ts";
import { createHash } from "node:crypto";
const migrations = ["001_core.sql", "002_authorized_updates.sql", "003_self_hosted_auth.sql"];
export async function migrate(db: Database) {
  // All new migrations commit atomically, with checksum protection and one migrator.
  const pending = await Promise.all(
    migrations.map(async (name, index) => ({
      version: index + 1,
      sql: await readFile(
        new URL(`../migrations/${name}`, import.meta.url),
        "utf8",
      ),
    })),
  );
  await db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(19003001)");
    await tx.query(
      "CREATE TABLE IF NOT EXISTS public.iaapp_schema_migrations (version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const { version, sql } of pending) {
      const checksum = createHash("sha256").update(sql).digest("hex");
      const old = (
        await tx.query(
          "SELECT checksum FROM public.iaapp_schema_migrations WHERE version=$1",
          [version],
        )
      ).rows[0];
      if (old) {
        if (old.checksum !== checksum)
          throw new Error(`Migration ${version} checksum changed`);
        continue;
      }
      await tx.query(sql);
      await tx.query(
        "INSERT INTO public.iaapp_schema_migrations(version,checksum) VALUES($1,$2)",
        [version, checksum],
      );
    }
  });
}
