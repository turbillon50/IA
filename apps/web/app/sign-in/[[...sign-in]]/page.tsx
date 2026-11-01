import {AuthForm} from '../../auth-form';
import {ownAuthEnabled} from '../../own-auth';
import { Mark } from '@iaapp/ui';
export const dynamic='force-dynamic';
export default function Login(){
 return <main className="auth"><div className="auth-card">
  <div className="brand"><Mark size={34}/><h1>IA.app</h1></div>
  <p className="lead">Ya tengo identidad IA.app</p>
  {ownAuthEnabled()?<AuthForm/>:<p className="lead">Estamos preparando el acceso. Vuelve en unos minutos.</p>}
  <p className="auth-alt">Acceso privado por invitación.</p>
 </div></main>;
}
