import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { AuthForm } from '../../auth-form';
export default function Login(){
 return process.env.NEON_AUTH_BASE_URL ? <main className="setup"><div className="setup-card"><p className="eyebrow">IAapp · ACCESO PRIVADO</p><h1>Bienvenido.</h1><AuthForm mode="enter"/><p>¿Primera vez? <Link href="/sign-up">Crear cuenta</Link></p></div></main> : <main className="empty"><h1>Tu espacio, tus conversaciones</h1>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY ? <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/chats"/> : <p>El acceso privado está pendiente de configuración.</p>}<Link href="/chats">Volver a IAapp</Link></main>;
}
