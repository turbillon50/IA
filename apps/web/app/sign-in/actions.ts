'use server';
import { redirect } from 'next/navigation';
import { neonAuth } from '../neon-auth';
export async function enter(_previous:{error:string}|null, form:FormData){
 const {error}=await neonAuth().signIn.email({email:String(form.get('email')||''),password:String(form.get('password')||'')});
 if(error)return {error:error.message||'No se pudo iniciar sesión.'};
 redirect('/alta');
}
