import 'server-only';
import pg from 'pg';

let pool: pg.Pool | undefined;
export async function myLine(subject: string) {
  const url=process.env.IAAPP_DATABASE_URL;
  if (!url) throw new Error('La base de IAapp no está configurada');
  pool ??= new pg.Pool({connectionString:url,max:2});
  const {rows}=await pool.query<{handle:string;display_name:string;workspace_id:string}>(
    `SELECT p.handle,p.display_name,p.workspace_id FROM iaapp.external_identities e
     JOIN iaapp.participants p ON p.user_id=e.user_id AND p.kind='human'
     JOIN iaapp.workspace_members wm ON wm.workspace_id=p.workspace_id AND wm.user_id=e.user_id AND wm.revoked_at IS NULL
     WHERE e.issuer=$1 AND e.client_id='iaapp-web' AND e.subject=$2 LIMIT 1`,
    [new URL(process.env.NEON_AUTH_BASE_URL!).origin,subject],
  );
  return rows[0]??null;
}
