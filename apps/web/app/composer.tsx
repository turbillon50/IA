'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
export function Composer({source,roomId}:{source:'fixture'|'api';roomId:string}) {
 const [draft,setDraft]=useState(''), [busy,setBusy]=useState(false), [status,setStatus]=useState('');
 const pending=useRef<{body:string;key:string}|null>(null), lock=useRef(false);
 const router=useRouter();
 async function send(){
  if(source!=='api'||lock.current||!draft.trim())return;
  lock.current=true;setBusy(true);setStatus('Guardando…');
  const body=JSON.stringify({body:draft.trim(),recipientParticipantIds:[],attachmentIds:[]});
  if(pending.current?.body!==body)pending.current={body,key:crypto.randomUUID()};
  try {
   const response=await fetch(`/api/backend/rooms/${encodeURIComponent(roomId)}/messages`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.current.key},body});
   if(!response.ok){const result=await response.json().catch(()=>null);throw new Error(result?.error?.message??'No se pudo guardar. Tu borrador sigue aquí.');}
   pending.current=null;setDraft('');setStatus('Guardado');router.refresh();
  }catch(e){setStatus(e instanceof Error?e.message:'No se pudo guardar. Intenta de nuevo.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <form className="composer-wrap" onSubmit={e=>{e.preventDefault();void send();}}><div className="composer-hint">{source==='fixture'?'Vista de diseño · No se envían mensajes':'Mensaje a la sala · Las respuestas de IA requieren vinculación'}</div><div className="composer"><textarea value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)} placeholder="Escribe un mensaje…" aria-label="Mensaje" maxLength={16000} rows={1} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/><button type="submit" disabled={source!=='api'||busy||!draft.trim()} aria-label="Enviar mensaje">↑</button></div><p className="composer-note" role="status" aria-live="polite">{status || (source==='fixture'?'Borrador de ejemplo. No se guarda al salir.':'Enter para enviar · Mayúsculas + Enter para nueva línea')}</p></form>;
}
