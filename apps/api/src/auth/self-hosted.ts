import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { jwt } from 'better-auth/plugins';
import { oauthProvider } from '@better-auth/oauth-provider';
import { createPublicKey } from 'node:crypto';
import { createLocalJWKSet, jwtVerify } from 'jose';
import type { Database } from '../../../../packages/db/src/sql.ts';
import { DomainError } from '../../../../packages/db/src/sql.ts';
import { IdentityResolver, type AuthAdapter, type HumanIdentity } from './identity.ts';
import type { McpConfig } from '../mcp/server.ts';
export { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
export { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata, verifyOAuthQueryParams } from '@better-auth/oauth-provider';

export interface SelfHostedOptions {
  baseURL: string;
  secret: string;
  database: NonNullable<BetterAuthOptions['database']>;
  db: Database;
  clientIds: readonly string[];
  /** Closed by default; enable only during explicit account provisioning. */
  allowSignUp?: boolean;
}

export function createSelfHostedIdentity(options: SelfHostedOptions) {
  const base = new URL(options.baseURL);
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/' ||
      (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(base.hostname)))) {
    throw new Error('INVALID_AUTH_ORIGIN');
  }
  if (options.secret.length < 32) throw new Error('AUTH_SECRET_TOO_SHORT');
  const origin = base.origin, issuer = origin + '/api/auth', resource = origin + '/mcp';
  const auth = betterAuth({
    appName: 'IAapp', baseURL: origin, basePath: '/api/auth', secret: options.secret,
    database: options.database,
    trustedOrigins: [origin],
    advanced: { database: { generateId: 'uuid' } },
    emailAndPassword: { enabled: true, disableSignUp: !options.allowSignUp, minPasswordLength: 12 },
    account: { accountLinking: { enabled: false } },
    session: { cookieCache: { enabled: false } },
    disabledPaths: ['/token'],
    plugins: [
      jwt({ disableSettingJwtHeader: true, jwks: { keyPairConfig: { alg: 'RS256' } }, jwt: { issuer } }),
      oauthProvider({
        loginPage: origin + '/auth/sign-in', consentPage: origin + '/auth/consent',
        scopes: ['openid', 'profile', 'iaapp:connect'],
        resources: [{ identifier: resource, allowedScopes: ['openid', 'profile', 'iaapp:connect'] }],
        grantTypes: ['authorization_code'],
        allowDynamicClientRegistration: false,
        // This switch is used by the offline provisioning command, never the HTTP runtime.
        clientPrivileges: () => options.allowSignUp === true,
        resourcePrivileges: () => options.allowSignUp === true,
      }),
    ],
  });
  const identity = (user: { id: string; name: string; email: string; emailVerified: boolean }): HumanIdentity => ({
    kind: 'human_session', issuer, clientId: 'iaapp-web', subject: user.id,
    displayName: user.name, verifiedEmails: user.emailVerified ? [user.email] : [],
  });
  const adapter: AuthAdapter = {
    async authenticate(request) {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) throw new DomainError('UNAUTHENTICATED');
      return identity(session.user);
    },
  };
  const resolver = new IdentityResolver(options.db, adapter);
  const mcp: McpConfig = {
    mode: 'profile', allowedOrigins: [origin],
    metadataUrl: origin + '/.well-known/oauth-protected-resource/mcp',
    oauth: {
      issuer, resource, clientIds: options.clientIds, clientIdClaim: 'azp',
      async resolveKey(kid) {
        const jwks = await auth.api.getJwks();
        const key = jwks.keys.find(k => k.kid === kid && k.kty === 'RSA');
        if (!key) throw new DomainError('UNAUTHENTICATED');
        return createPublicKey({ key, format: 'jwk' });
      },
      async isTokenActive(token, clientId) {
        const { payload } = await jwtVerify(token, createLocalJWKSet(await auth.api.getJwks()), {
          issuer, audience: resource, algorithms: ['RS256'], requiredClaims: ['sub', 'exp', 'sid'],
        });
        if (payload.azp !== clientId || typeof payload.sid !== 'string') return false;
        const context = await auth.$context;
        const [session, client, consent] = await Promise.all([
          context.adapter.findOne<{ userId: string; expiresAt: Date }>({ model: 'session', where: [{ field: 'id', value: payload.sid }] }),
          context.adapter.findOne<{ disabled?: boolean }>({ model: 'oauthClient', where: [{ field: 'clientId', value: clientId }] }),
          context.adapter.findOne<{ scopes: string[] }>({ model: 'oauthConsent', where: [{ field: 'clientId', value: clientId }, { field: 'userId', value: payload.sub! }] }),
        ]);
        return !!session && session.userId === payload.sub && session.expiresAt > new Date() &&
          !!client && !client.disabled && !!consent && consent.scopes.includes('iaapp:connect');
      },
      async resolveIdentity({ subject }) {
        // Subject comes only from the cryptographically validated, active OAuth token.
        const context = await auth.$context;
        const user = await context.internalAdapter.findUserById(subject);
        if (!user) return null;
        return (await resolver.resolve(identity(user))).actor.userId;
      },
    },
    async getAuthorizedProfile(userId) {
      const result = await options.db.transaction(tx => tx.query(
        'SELECT id, display_name, line_number::text AS line_number FROM iaapp.users WHERE id=$1', [userId],
      ));
      const row = result.rows[0];
      return row ? { userId: row.id as string, lineNumber: row.line_number as string, displayName: row.display_name as string } : null;
    },
  };
  return { auth, adapter, mcp, resolver, origin, issuer };
}
