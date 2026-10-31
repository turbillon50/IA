import Link from 'next/link';
import { apiEnabled, readBackend } from '../backend';
import { Alta } from './alta';
import { neonAuth } from '../neon-auth';
import { myLine } from '../line';

export const dynamic = 'force-dynamic';

export default async function AltaPage() {
  if (!apiEnabled()) {
    if (process.env.NEON_AUTH_BASE_URL) {
      const {data}=await neonAuth().getSession();
      if (!data?.user) return <main className="setup"><h1>Tu primera línea</h1><p>Entra a tu cuenta para continuar.</p><Link href="/sign-in">Iniciar sesión</Link></main>;
      try {
        const line=await myLine(data.user.id);
        if (!line) return <main className="setup"><h1>Tu cuenta está activa.</h1><p>Tu línea todavía no ha sido asignada. No mostraremos conversaciones de ejemplo como si fueran tuyas.</p></main>;
        return <main className="setup"><div className="setup-card"><div className="eyebrow">TU NÚMERO PERSONAL</div><h1>{line.handle}</h1><p>Esta línea pertenece a tu cuenta autenticada, {data.user.name}. Puedes compartir el identificador para que te encuentren en IAapp.</p><div className="setup-step"><h2>Vincular esta conversación</h2><p>ChatGPT aún no está conectado a esta línea. El emparejamiento necesita autorización y una prueba de ida y vuelta.</p><span className="badge">Pendiente de conexión</span></div></div></main>;
      } catch {
        return <main className="setup"><h1>No pudimos cargar tu línea.</h1><p>Tu cuenta sigue activa. Intenta de nuevo en unos minutos.</p></main>;
      }
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
