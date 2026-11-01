'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
export function Composer({source,roomId,direct,targets}:{source:'fixture'|'api';roomId:string;direct:boolean;targets:{id:string;name:string}[]}) {
 const [draft,setDraft]=useState(''), [busy,setBusy]=useState(false), [status,setStatus]=useState(''), [failed,setFailed]=useState(false);
 const pending=useRef<{body:string;key:string}|null>(null), lock=useRef(false);
 const router=useRouter();
 const [recipients,setRecipients]=useState<string[]>([]);
 async function send(){
  if(source!=='api'||lock.current||!draft.trim())return;
  if(direct&&recipients.length!==1){setStatus('Elige la IA destinataria.');setFailed(true);return;}
  lock.current=true;setBusy(true);setStatus('Enviando…');setFailed(false);
  const body=JSON.stringify({body:draft.trim(),recipientParticipantIds:recipients,attachmentIds:[]});
  if(pending.current?.body!==body)pending.current={body,key:crypto.randomUUID()};
  try {
   const response=await fetch(`/api/backend/rooms/${encodeURIComponent(roomId)}/messages`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.current.key},body});
   if(!response.ok){const result=await response.json().catch(()=>null);throw new Error(result?.error?.message??'No se pudo enviar. Tu mensaje sigue aquí.');}
   pending.current=null;setDraft('');setStatus('');router.refresh();
  }catch(e){const msg=e instanceof Error?e.message:'No se pudo enviar. Intenta de nuevo.';setStatus(msg);setFailed(true);}
  finally{lock.current=false;setBusy(false);}
 }
 return <form className="composer-wrap" onSubmit={e=>{e.preventDefault();void send();}}>
  {source==='api'&&targets.length>0&&<div className="composer-target"><label htmlFor="ia-target">Dirigir a</label><select id="ia-target" aria-label="IA destinataria" disabled={busy} value={recipients[0]??''} onChange={e=>setRecipients(e.target.value?[e.target.value]:[])}><option value="">{direct?'Elige la IA':'Solo a la sala'}</option>{targets.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
  <div className="composer">
   <textarea value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)} placeholder="Escribe un mensaje" aria-label="Mensaje" maxLength={16000} rows={1} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/>
   <button type="submit" disabled={source!=='api'||busy||!draft.trim()} aria-label="Enviar mensaje">↑</button>
  </div>
  <p className={`composer-note${failed?' is-error':''}`} role="status" aria-live="polite">{status}</p>
 </form>;
}
