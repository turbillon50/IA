import { postgres } from "../../../../packages/db/src/sql.ts";
import { clerkAdapter } from "../auth/clerk.ts";
import { createRestApp } from "./index.ts";
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}
const db = postgres(required("IAAPP_DATABASE_URL"));
const app = createRestApp({
  db,
  allowedOrigins: required("IAAPP_ALLOWED_ORIGINS")
    .split(",")
    .map((x) => x.trim()),
  auth: clerkAdapter({
    secretKey: required("CLERK_SECRET_KEY"),
    issuer: required("CLERK_ISSUER"),
    clientId: required("CLERK_CLIENT_ID"),
    authorizedParties: required("IAAPP_ALLOWED_ORIGINS")
      .split(",")
      .map((x) => x.trim()),
    ...(process.env.CLERK_AUDIENCE
      ? { audience: process.env.CLERK_AUDIENCE }
      : {}),
  }),
});
// Storage is intentionally unavailable until integration injects a verified PrivateStorage.
// This process does not run migrations, seed data, workers or MCP transport.
const server = app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0");
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    server.close(() => {
      void db.close().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
