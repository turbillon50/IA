'use client';
import { useActionState } from 'react';
import { register } from './sign-up/actions';
import { enter } from './sign-in/actions';
export function AuthForm({mode}:{mode:'register'|'enter'}){
 const [state,action,busy]=useActionState(mode==='register'?register:enter,null);
 return <form action={action} className="setup-step">
  {mode==='register'&&<label>Nombre<input name="name" autoComplete="name" required maxLength={200}/></label>}
  <label>Correo<input name="email" type="email" autoComplete="email" required/></label>
  <label>Contraseña<input name="password" type="password" autoComplete={mode==='register'?'new-password':'current-password'} required minLength={mode==='register'?12:1}/></label>
  {state?.error&&<p role="alert" className="setup-error">{state.error}</p>}
  <button disabled={busy}>{busy?'Un momento…':mode==='register'?'Crear cuenta':'Entrar'}</button>
 </form>
}
