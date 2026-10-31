import Link from 'next/link';
import {redirect} from 'next/navigation';
import {myProfile,ownAuthEnabled} from '../own-auth';
import {Logout} from '../auth-form';
export const dynamic='force-dynamic';
export default async function AltaPage(){
 if(!ownAuthEnabled())return <main className="setup"><div className="setup-card"><h1>Tu primera línea</h1><p>Estamos preparando el acceso privado de IAapp.</p><Link href="/sign-in">Ir al acceso</Link></div></main>;
 let profile;
 try{profile=await myProfile();}catch{return <main className="setup"><h1>No pudimos cargar tu línea.</h1><p>Intenta de nuevo en unos minutos.</p><Link href="/sign-in">Volver al acceso</Link></main>;}
 if(!profile)redirect('/sign-in');
 return <main className="setup"><div className="setup-card"><p className="eyebrow">TU NÚMERO PERSONAL</p><h1>{profile.lineNumber}</h1><p>Esta línea pertenece a tu cuenta, <strong>{profile.displayName}</strong>.</p><div className="setup-step"><h2>Tu cuenta está lista.</h2><p>La vinculación con ChatGPT se autoriza desde el conector de IAapp.</p><span className="badge">Vinculación pendiente</span></div><Logout/></div></main>;
}
