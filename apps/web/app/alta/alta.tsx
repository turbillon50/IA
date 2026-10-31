'use client';
import { useState } from 'react';
import Link from 'next/link';

type Me = {user:{id:string;displayName:string};workspaces:{id:string;name:string}[]};
type AI = {id:string;displayName:string;handle:string};
type Pairing = {code:string;expiresAt:string};

async function send<T>(path:string, body:unknown = {}):Promise<T> {
  const response=await fetch(`/api/backend/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error?.message || `No se pudo completar (${response.status}).`);
  return data as T;
}

export function Alta({me,existing}: {me:Me;existing:AI[]}) {
  const [workspace,setWorkspace]=useState(me.workspaces[0]?.id ?? '');
  const [ai,setAI]=useState<AI|null>(null);
  const [pairing,setPairing]=useState<Pairing|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [name,setName]=useState('Mi IA');
  const [purpose,setPurpose]=useState('Trabajar conmigo en IAapp');
  async function run(work:()=>Promise<void>){setBusy(true);setError('');try{await work()}catch(e){setError(e instanceof Error?e.message:'Ocurrió un error.')}finally{setBusy(false)}}
  const prompt=pairing&&ai?`Conecta este chat con mi perfil ${ai.displayName} en IAapp. Usa el plugin IAapp para reclamar el código de un solo uso ${pairing.code} y suscríbete a los eventos de este perfil. Confirma el emparejamiento cuando recibas la prueba. No anuncies conexión hasta completar esa confirmación.`:'';
  return <main className="setup"><div className="setup-head"><Link href="/chats" aria-label="Volver a conversaciones">←</Link><span>IAapp · Alta privada</span></div>
    <div className="setup-card"><div className="eyebrow">PRIMER VÍNCULO</div><h1>Tu línea empieza aquí.</h1><p>Cuenta autenticada: <strong>{me.user.displayName}</strong>. Incorporaremos una conversación elegida por ti; no se importará tu historial.</p>
      {!workspace?<div className="setup-step"><h2>1 · Abrir tu espacio</h2><p>Solo el fundador designado por el servidor puede crear el primer espacio.</p><button disabled={busy} onClick={()=>run(async()=>{const r=await send<{workspaceId:string}>('bootstrap');setWorkspace(r.workspaceId)})}>Crear espacio privado</button></div>:<div className="setup-step"><h2>1 · Espacio privado</h2><p>Tu cuenta ya tiene acceso a IAapp.</p></div>}
      {workspace&&!ai&&<form className="setup-step" onSubmit={e=>{e.preventDefault();void run(async()=>{const r=await send<AI>(`workspaces/${workspace}/participants/ai`,{displayName:name,purpose});setAI(r)})}}><h2>2 · Elegir tu IA</h2>{existing.length>0&&<div className="existing-ai">{existing.map(p=><button type="button" key={p.id} onClick={()=>setAI(p)}>Continuar con {p.displayName}</button>)}</div>}<p>O registra una nueva conversación elegida por ti.</p><label>Nombre visible<input value={name} maxLength={200} required onChange={e=>setName(e.target.value)}/></label><label>Encargo<textarea value={purpose} maxLength={2000} required onChange={e=>setPurpose(e.target.value)}/></label><button disabled={busy}>Crear perfil</button></form>}
      {ai&&<div className="setup-step"><h2>2 · Perfil creado</h2><p><strong>{ai.displayName}</strong> · {ai.handle}</p><p>Este perfil todavía no acredita una conversación conectada.</p>{!pairing&&<button disabled={busy} onClick={()=>run(async()=>setPairing(await send<Pairing>(`participants/${ai.id}/pairing`)))}>Generar código de vinculación</button>}</div>}
      {pairing&&<div className="setup-step"><h2>3 · Vincular esta conversación</h2><p>El código vence a las {new Date(pairing.expiresAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',timeZone:'America/Cancun'})}. Generar otro revoca el anterior.</p><textarea className="setup-prompt" value={prompt} readOnly aria-label="Instrucción para conectar el chat"/><button type="button" onClick={()=>void navigator.clipboard.writeText(prompt)}>Copiar instrucción</button><p>La conexión se considerará lista solo después de recibir y confirmar el evento de prueba.</p></div>}
      {error&&<p role="alert" className="setup-error">{error}</p>}
    </div>
  </main>;
}
