'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}){
 return <main className="empty"><h1>No pudimos abrir tu espacio</h1><p>Comprueba tu conexión y tu sesión. Tus datos no se sustituyeron por ejemplos.</p><button onClick={reset}>Volver a intentar</button><p><Link href="/sign-in">Iniciar sesión</Link></p></main>;
}
