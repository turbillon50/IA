-- Generated from Better Auth + OAuth Provider 1.7.14; regenerate with npm run generate:schema --prefix apps/api/src/auth.
ALTER TABLE iaapp.users ADD COLUMN line_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 100000) UNIQUE;
CREATE SCHEMA IF NOT EXISTS iaapp_auth;
SET LOCAL search_path = iaapp_auth, public;
create schema if not exists "iaapp_auth";

create table "iaapp_auth"."user" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "iaapp_auth"."session" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" uuid not null references "iaapp_auth"."user" ("id") on delete cascade);

create table "iaapp_auth"."account" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "accountId" text not null, "providerId" text not null, "userId" uuid not null references "iaapp_auth"."user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "iaapp_auth"."verification" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "iaapp_auth"."jwks" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz, "alg" text, "crv" text);

create table "iaapp_auth"."oauthClient" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" boolean, "skipConsent" boolean, "enableEndSession" boolean, "subjectType" text, "scopes" jsonb, "clientCredentialsScopes" jsonb, "userId" uuid references "iaapp_auth"."user" ("id") on delete cascade, "createdAt" timestamptz, "updatedAt" timestamptz, "name" text, "uri" text, "icon" text, "contacts" jsonb, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" jsonb not null, "postLogoutRedirectUris" jsonb, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" boolean, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" jsonb, "responseTypes" jsonb, "requirePKCE" boolean, "dpopBoundAccessTokens" boolean, "referenceId" text, "metadata" jsonb);

create table "iaapp_auth"."oauthResource" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" jsonb, "customClaims" jsonb, "dpopBoundAccessTokensRequired" boolean, "disabled" boolean, "createdAt" timestamptz, "updatedAt" timestamptz, "policyVersion" integer, "metadata" jsonb);

create table "iaapp_auth"."oauthClientResource" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "clientId" text not null references "iaapp_auth"."oauthClient" ("clientId") on delete cascade, "resourceId" text not null references "iaapp_auth"."oauthResource" ("identifier") on delete cascade, "metadata" jsonb, "createdAt" timestamptz);

create table "iaapp_auth"."oauthRefreshToken" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "token" text not null unique, "clientId" text not null references "iaapp_auth"."oauthClient" ("clientId") on delete cascade, "sessionId" uuid references "iaapp_auth"."session" ("id") on delete set null, "userId" uuid not null references "iaapp_auth"."user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "rotatedAt" timestamptz, "rotationReplayResponse" text, "rotationReplayExpiresAt" timestamptz, "authTime" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table "iaapp_auth"."oauthAccessToken" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "token" text not null unique, "clientId" text not null references "iaapp_auth"."oauthClient" ("clientId") on delete cascade, "sessionId" uuid references "iaapp_auth"."session" ("id") on delete set null, "userId" uuid references "iaapp_auth"."user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "refreshId" uuid references "iaapp_auth"."oauthRefreshToken" ("id") on delete cascade, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table "iaapp_auth"."oauthConsent" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "clientId" text not null references "iaapp_auth"."oauthClient" ("clientId") on delete cascade, "userId" uuid references "iaapp_auth"."user" ("id") on delete cascade, "referenceId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "scopes" jsonb not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null);

create table "iaapp_auth"."oauthClientAssertion" ("id" uuid default pg_catalog.gen_random_uuid() not null primary key, "expiresAt" timestamptz not null);

create index "session_userId_idx" on "iaapp_auth"."session" ("userId");

create index "account_userId_idx" on "iaapp_auth"."account" ("userId");

create index "verification_identifier_idx" on "iaapp_auth"."verification" ("identifier");

create index "oauthClient_userId_idx" on "iaapp_auth"."oauthClient" ("userId");

create index "oauthClientResource_clientId_idx" on "iaapp_auth"."oauthClientResource" ("clientId");

create index "oauthClientResource_resourceId_idx" on "iaapp_auth"."oauthClientResource" ("resourceId");

create index "oauthRefreshToken_clientId_idx" on "iaapp_auth"."oauthRefreshToken" ("clientId");

create index "oauthRefreshToken_sessionId_idx" on "iaapp_auth"."oauthRefreshToken" ("sessionId");

create index "oauthRefreshToken_userId_idx" on "iaapp_auth"."oauthRefreshToken" ("userId");

create index "oauthRefreshToken_authorizationCodeId_idx" on "iaapp_auth"."oauthRefreshToken" ("authorizationCodeId");

create index "oauthAccessToken_clientId_idx" on "iaapp_auth"."oauthAccessToken" ("clientId");

create index "oauthAccessToken_sessionId_idx" on "iaapp_auth"."oauthAccessToken" ("sessionId");

create index "oauthAccessToken_userId_idx" on "iaapp_auth"."oauthAccessToken" ("userId");

create index "oauthAccessToken_authorizationCodeId_idx" on "iaapp_auth"."oauthAccessToken" ("authorizationCodeId");

create index "oauthAccessToken_refreshId_idx" on "iaapp_auth"."oauthAccessToken" ("refreshId");

create index "oauthConsent_clientId_idx" on "iaapp_auth"."oauthConsent" ("clientId");

create index "oauthConsent_userId_idx" on "iaapp_auth"."oauthConsent" ("userId");

create unique index "oauthClientResource_clientId_resourceId_uidx" on "iaapp_auth"."oauthClientResource" ("clientId", "resourceId");
REVOKE ALL ON SCHEMA iaapp_auth FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA iaapp_auth FROM PUBLIC;
SET LOCAL search_path = public;
