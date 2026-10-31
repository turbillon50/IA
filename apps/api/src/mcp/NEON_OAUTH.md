# Neon OAuth adapter for IAapp MCP (not deployed)

The existing `createApplication({ rest, mcp })` already mounts the MCP HTTP endpoint and
RFC 9728 protected-resource metadata. `createNeonMcpConfig` in `neon-oauth.ts` supplies
the **pinned Neon Auth issuer/JWKS** and a server-side profile lookup; it does not
create a new auth provider or change the human REST login.

Required configuration (provide through a secret manager, not a checked-in .env):
- Exact `issuer` of the Neon **Auth** JWT, not the Neon management API or MCP OAuth issuer.
- Exact `resource` (HTTPS MCP URL, used as JWT `aud`), and public metadata URL.
- Issuer-owned HTTPS `jwksUrl` and explicitly registered `clientIds`.
- `resolveIdentity` that validates current grants/revocation and maps issuer + client + sub
  to a real IAapp account. Never create an account implicitly from JWT claims.
- `resolveProfile` that reads only that account's authorized profile in the IAapp database.
- Persistent `McpRepository`, encryption key, webhook delivery adapter and callback allowlist.

The JWT validator checks RS256 signature against the pinned JWKS, issuer, audience,
expiry, nbf, client_id, scope and active identity mapping before any profile query.
`get_my_profile` fails closed if the profile resolver is missing, returns null or
returns a different user ID. No browser cookies, Neon API keys, self-supplied
JWKS, token-provided profile fields or opaque access tokens are accepted.

**Important:** Neon Auth tokens used for Data API are not automatically OAuth
access tokens for ChatGPT's MCP client. A registered authorization server must
issue a token with the configured `aud`, `client_id` and scopes, and support
OAuth discovery, PKCE and ChatGPT callback registration. If Neon Auth does not
issue this token shape, use a registered OAuth authorization server that does;
do not remove validation to make it pass.

Local proof (Node 24):
```sh
node --experimental-strip-types --test apps/api/src/mcp/neon-oauth.test.ts
```
The test uses an ephemeral RSA key/JWKS, an HTTP loopback server and a fake
account resolver: no-token -> 401; valid signed token -> authorized profile;
wrong issuer/audience, unknown subject, expired and corrupted signature -> 401.
This is NOT proof of a real Neon token or live ChatGPT OAuth connection.

For live testing, we still need the issuer, audience, JWKS, registered OAuth
client, account resolver and Postgres repository, plus a running API process.
The default `apps/api/src/rest/server.ts` deliberately does not enable MCP
without that complete configuration. No production deployment is part of this change.
