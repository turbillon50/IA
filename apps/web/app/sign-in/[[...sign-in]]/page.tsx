import Link from 'next/link';
import {AuthForm} from '../../auth-form';
import {ownAuthEnabled} from '../../own-auth';
export const dynamic='force-dynamic';
export default function Login(){
 return <main className="setup"><div className="setup-card"><p className="eyebrow">IAapp · ACCESO PRIVADO</p><h1>Bienvenido.</h1>
 {ownAuthEnabled()?<AuthForm/>:<p>Estamos preparando el acceso a tu cuenta. Vuelve en unos minutos.</p>}
 <p>Acceso por invitación.</p><Link href="/alta">Volver a mi línea</Link></div></main>;
}
