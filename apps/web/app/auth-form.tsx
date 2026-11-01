'use client';
import {useState} from 'react';
export function AuthForm(){
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form style={{display:'contents'}} onSubmit={async event=>{
  event.preventDefault();setBusy(true);setError('');
  const form=new FormData(event.currentTarget);
  const query=location.search.slice(1);
  try{
   const response=await fetch('/api/auth/sign-in/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:String(form.get('email')||''),password:String(form.get('password')||''),...(query?{oauth_query:query}:{})})});
   const data=await response.json();
   if(!response.ok)throw Error(response.status===401?'Revisa tu correo y contraseña.':'No pudimos iniciar sesión. Intenta de nuevo.');
   const target=new URL(data.url||data.redirect_uri||'/chats',location.origin);
   if(target.protocol!=='https:'&&target.origin!==location.origin)throw Error('No se pudo continuar la autorización.');
   location.assign(target.href);
  }catch(e){setError(e instanceof Error?e.message:'No pudimos iniciar sesión.');setBusy(false);}
 }}>
  <label className="field"><span>Correo</span><input name="email" type="email" autoComplete="username" required/></label>
  <label className="field"><span>Contraseña</span><input name="password" type="password" autoComplete="current-password" required/></label>
  {error&&<p role="alert" className="setup-error">{error}</p>}
  <button className="btn" disabled={busy}>{busy?'Un momento…':'Entrar'}</button>
 </form>;
}
export function Logout(){const[busy,setBusy]=useState(false);return <button className="btn btn-ghost" disabled={busy} onClick={async()=>{setBusy(true);const r=await fetch('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok)location.assign('/sign-in');else setBusy(false);}}>Cerrar sesión</button>;}
