import { postgres } from "./sql.ts";
import { migrate } from "./migrate.ts";
// This entry point only migrates the explicitly configured existing database.
// Synthetic seed is intentionally not exposed as a production CLI command.
if (process.argv[2] !== "migrate" || !process.env.IAAPP_DATABASE_URL)
  throw new Error(
    "Usage: IAAPP_DATABASE_URL=<existing database> node src/cli.ts migrate",
  );
const db = postgres(process.env.IAAPP_DATABASE_URL);
try {
  await migrate(db);
  process.stdout.write("IAapp migrations applied.\n");
} finally {
  await db.close();
}
