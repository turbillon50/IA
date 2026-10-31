import type { Database } from '../../../../packages/db/src/sql.ts';

/** Explicit operator-only cutover. IDs prove the mapping; email never links accounts.
 * Copies only password accounts, never external tokens, sessions or signing keys.
 */
export async function importExistingCredentials(db:Database,sourceIssuer:string,targetIssuer:string){
 const target=new URL(targetIssuer);
 if(sourceIssuer===targetIssuer||!sourceIssuer.startsWith('https://')||
   (target.protocol!=='https:'&&!(target.protocol==='http:'&&['localhost','127.0.0.1'].includes(target.hostname))))throw Error('INVALID_ISSUER');
 return db.transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock(19003002)');
  const conflict=await tx.query(`SELECT 1 FROM iaapp.external_identities old
   JOIN neon_auth."user" u ON old.subject=u.id::text
   JOIN iaapp.external_identities own ON own.subject=u.id::text AND own.client_id='iaapp-web' AND own.issuer=$2
   WHERE old.issuer=$1 AND old.client_id='iaapp-web' AND old.user_id<>own.user_id`,[sourceIssuer,targetIssuer]);
  if(conflict.rows.length)throw Error('IDENTITY_CONFLICT');
  const imported=await tx.query(`INSERT INTO iaapp_auth."user"(id,name,email,"emailVerified",image,"createdAt","updatedAt")
   SELECT u.id,u.name,u.email,u."emailVerified",u.image,u."createdAt",u."updatedAt"
   FROM neon_auth."user" u JOIN iaapp.external_identities e ON e.subject=u.id::text
   WHERE e.issuer=$1 AND e.client_id='iaapp-web' AND COALESCE(u.banned,false)=false
   AND EXISTS(SELECT 1 FROM neon_auth.account a WHERE a."userId"=u.id AND a."providerId"='credential' AND a.password IS NOT NULL)
   ON CONFLICT(id) DO NOTHING RETURNING id`,[sourceIssuer]);
  await tx.query(`INSERT INTO iaapp_auth.account(id,"accountId","providerId","userId",password,"createdAt","updatedAt")
   SELECT a.id,a."accountId",a."providerId",a."userId",a.password,a."createdAt",a."updatedAt"
   FROM neon_auth.account a JOIN neon_auth."user" u ON u.id=a."userId"
   JOIN iaapp.external_identities e ON e.subject=u.id::text
   JOIN iaapp_auth."user" own ON own.id=u.id
   WHERE e.issuer=$1 AND e.client_id='iaapp-web' AND COALESCE(u.banned,false)=false
   AND a."providerId"='credential' AND a.password IS NOT NULL ON CONFLICT(id) DO NOTHING`,[sourceIssuer]);
  await tx.query(`INSERT INTO iaapp.external_identities(user_id,issuer,client_id,subject)
   SELECT e.user_id,$2,'iaapp-web',e.subject FROM iaapp.external_identities e
   JOIN iaapp_auth."user" u ON u.id::text=e.subject
   WHERE e.issuer=$1 AND e.client_id='iaapp-web' ON CONFLICT(issuer,client_id,subject) DO NOTHING`,[sourceIssuer,targetIssuer]);
  return {imported:imported.rows.length};
 });
}
