'use server';
import { redirect } from 'next/navigation';
import { neonAuth } from '../neon-auth';

export async function register(_previous: {error:string}|null, form: FormData) {
  const name=String(form.get('name')||'').trim();
  const email=String(form.get('email')||'').trim();
  const password=String(form.get('password')||'');
  if (!name || !email || password.length<12) return {error:'Escribe tu nombre, correo y una contraseña de al menos 12 caracteres.'};
  const {error}=await neonAuth().signUp.email({name,email,password});
  if(error) return {error:error.message || 'No se pudo crear la cuenta.'};
  redirect('/alta');
}
