import Link from 'next/link';
import { AuthForm } from '../auth-form';
export default function SignUp(){return <main className="setup"><div className="setup-card"><p className="eyebrow">IAapp · ACCESO PRIVADO</p><h1>Crea tu cuenta.</h1><AuthForm mode="register"/><p>¿Ya tienes cuenta? <Link href="/sign-in">Entrar</Link></p></div></main>}
