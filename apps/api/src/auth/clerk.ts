import { createClerkClient, verifyToken } from "@clerk/backend";
import type { AuthAdapter, HumanIdentity } from "./identity.ts";
import { fail } from "../../../../packages/db/src/sql.ts";
/** PWA bearer sessions only. MCP OAuth must have a separate verifier/entry point. */
export function clerkAdapter(config: {
  secretKey: string;
  issuer: string;
  clientId: string;
  authorizedParties: string[];
  audience?: string;
}): AuthAdapter {
  if (
    !config.secretKey ||
    !config.issuer.startsWith("https://") ||
    !config.clientId ||
    !config.authorizedParties.length
  )
    throw new Error("Incomplete Clerk configuration");
  const clerk = createClerkClient({ secretKey: config.secretKey });
  return {
    async authenticate(request: Request): Promise<HumanIdentity> {
      const header = request.headers.get("authorization");
      if (!header?.startsWith("Bearer ")) return fail("UNAUTHENTICATED");
      try {
        const claims = await verifyToken(header.slice(7), {
          secretKey: config.secretKey,
          authorizedParties: config.authorizedParties,
          ...(config.audience ? { audience: config.audience } : {}),
        });
        if (
          claims.iss !== config.issuer ||
          !claims.sid ||
          !claims.sub ||
          !claims.azp ||
          !config.authorizedParties.includes(claims.azp)
        )
          return fail("UNAUTHENTICATED");
        // Check live session revocation, not just a still-unexpired JWT.
        const session = await clerk.sessions.getSession(claims.sid);
        if (session.status !== "active" || session.userId !== claims.sub)
          return fail("UNAUTHENTICATED");
        const user = await clerk.users.getUser(claims.sub);
        if (user.banned || user.locked) return fail("UNAUTHENTICATED");
        return {
          kind: "human_session",
          issuer: config.issuer,
          clientId: config.clientId,
          subject: claims.sub,
          verifiedEmails: user.emailAddresses
            .filter((e) => e.verification?.status === "verified")
            .map((e) => e.emailAddress.toLowerCase()),
          displayName:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            "Invitado",
        };
      } catch {
        return fail("UNAUTHENTICATED");
      }
    },
  };
}
