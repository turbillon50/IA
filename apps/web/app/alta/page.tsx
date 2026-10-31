import Link from 'next/link';
import { apiEnabled, readBackend } from '../backend';
import { Alta } from './alta';
import { neonAuth } from '../neon-auth';

export const dynamic = 'force-dynamic';

export default async function AltaPage() {
  if (!apiEnabled()) {
    if (process.env.NEON_AUTH_BASE_URL) {
      const {data}=await neonAuth().getSession();
      if (!data?.user) return <main className="setup"><h1>Tu primera línea</h1><p>Entra a tu cuenta para continuar.</p><Link href="/sign-in">Iniciar sesión</Link></main>;
      return <main className="setup"><h1>Cuenta activa</h1><p>{data.user.name}, tu registro ya está autenticado. La creación de tu espacio privado aún está en preparación.</p><Link href="/chats">Volver a conversaciones</Link></main>;
    }
    return <main className="setup"><h1>Tu primera línea</h1><p>La base de IAapp aún no está conectada. Esta pantalla no creará identidades de ejemplo.</p><Link href="/chats">Volver al chat</Link></main>;
  }
  try {
    const me = await readBackend<{user:{id:string;displayName:string};workspaces:{id:string;name:string}[]}>('/me');
    const workspace=me.workspaces[0];
    const people=workspace?await readBackend<{items:{id:string;kind:string;ownerUserId?:string;displayName:string;handle:string}[]}>(`/workspaces/${workspace.id}/participants`):{items:[]};
    return <Alta me={me} existing={people.items.filter(p=>p.kind==='ai'&&p.ownerUserId===me.user.id)} />;
  } catch {
    return <main className="setup"><h1>Tu primera línea</h1><p>No pudimos verificar tu cuenta. Inicia sesión y vuelve a intentar.</p><Link href="/sign-in">Iniciar sesión</Link></main>;
  }
}
