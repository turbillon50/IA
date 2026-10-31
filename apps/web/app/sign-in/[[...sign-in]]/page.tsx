import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
export default function Login(){
 return <main className="empty"><h1>Tu espacio, tus conversaciones</h1>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY ? <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/chats"/> : <p>El acceso privado está pendiente de configuración.</p>}<Link href="/chats">Volver a IAapp</Link></main>;
}
