'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mark } from '@iaapp/ui';
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
 return <main className="auth"><div className="auth-card" style={{textAlign:'left',gap:20}}>
  <div className="brand" style={{alignItems:'flex-start'}}><Mark size={26}/></div>
  <div><h1 style={{textAlign:'left'}}>Tu línea empieza aquí.</h1><p className="lead" style={{textAlign:'left'}}>Cuenta: <strong style={{color:'var(--text)'}}>{me.user.displayName}</strong>. Incorporaremos una conversación elegida por ti; no se importa tu historial.</p></div>
  {!workspace?<div className="field"><span>1 · Abrir tu espacio</span><p className="hint" style={{margin:'0 0 10px',color:'var(--muted)',fontSize:'12.5px'}}>Solo el fundador designado por el servidor puede crear el primer espacio.</p><button className="btn" disabled={busy} onClick={()=>run(async()=>{const r=await send<{workspaceId:string}>('bootstrap');setWorkspace(r.workspaceId)})}>Crear espacio privado</button></div>
  :!ai?<form className="field" onSubmit={e=>{e.preventDefault();void run(async()=>{const r=await send<AI>(`workspaces/${workspace}/participants/ai`,{displayName:name,purpose});setAI(r)})}}>
    <span>2 · Elegir tu IA</span>
    {existing.length>0&&<ul style={{listStyle:'none',margin:'0 0 12px',padding:0,display:'flex',flexDirection:'column',gap:4}}>{existing.map(p=><li key={p.id}><button type="button" className="btn btn-ghost" style={{width:'100%',justifyContent:'flex-start'}} onClick={()=>setAI(p)}>Continuar con {p.displayName}</button></li>)}</ul>}
    <label style={{display:'grid',gap:7,fontSize:12,color:'var(--muted)',marginBottom:10}}>Nombre visible<input className="field" style={{color:'var(--text)'}} value={name} maxLength={200} required onChange={e=>setName(e.target.value)}/></label>
    <label style={{display:'grid',gap:7,fontSize:12,color:'var(--muted)',marginBottom:14}}>Encargo<textarea value={purpose} maxLength={2000} required onChange={e=>setPurpose(e.target.value)} style={{background:'var(--panel2)',border:'1px solid var(--line2)',borderRadius:12,color:'var(--text)',padding:12,minHeight:78,resize:'vertical',fontSize:16}}/></label>
    <button className="btn" disabled={busy}>{busy?'Un momento…':'Crear perfil'}</button>
   </form>
  :<div className="field"><span>3 · Perfil creado</span><p style={{margin:'4px 0 10px',fontSize:14}}><strong>{ai.displayName}</strong> · {ai.handle}</p><p className="hint" style={{color:'var(--muted)',fontSize:'12.5px',margin:'0 0 10px'}}>Este perfil todavía no acredita una conversación conectada.</p>{!pairing&&<button className="btn" disabled={busy} onClick={()=>run(async()=>setPairing(await send<Pairing>(`participants/${ai.id}/pairing`)))}>Generar código de vinculación</button>}</div>}
  {pairing&&<div className="field"><span>Vincular esta conversación</span><p style={{margin:'4px 0 10px',color:'var(--muted)',fontSize:'12.5px'}}>El código vence a las {new Date(pairing.expiresAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',timeZone:'America/Cancun'})}. Generar otro revoca el anterior.</p><textarea value={prompt} readOnly aria-label="Instrucción para conectar el chat" style={{background:'var(--panel2)',border:'1px solid var(--line2)',borderRadius:12,color:'var(--text)',padding:12,minHeight:120,fontSize:13,lineHeight:1.5}}/><button type="button" className="btn btn-ghost" onClick={()=>void navigator.clipboard.writeText(prompt)}>Copiar instrucción</button></div>}
  {error&&<p role="alert" className="setup-error">{error}</p>}
  <Link href="/chats" style={{color:'var(--muted)',fontSize:13,textAlign:'center'}}>← Volver a conversaciones</Link>
 </div></main>;
}
