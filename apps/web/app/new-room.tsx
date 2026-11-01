'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export function NewRoom({workspaceId,people}:{workspaceId:string;people:{id:string;name:string}[]}) {
 const [open,setOpen]=useState(false);
 const [title,setTitle]=useState('');
 const [members,setMembers]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const router=useRouter();
 async function create(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (busy || !title.trim() || !workspaceId) return;
  setBusy(true); setError('');
  try {
   const response=await fetch(`/api/backend/workspaces/${encodeURIComponent(workspaceId)}/rooms`,{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({title:title.trim(),kind:'group',participantIds:members})
   });
   const data=await response.json();
   if(!response.ok || !data.id) throw Error(data.error?.message || 'No se pudo crear la conversación.');
   setOpen(false); setTitle(''); setMembers([]);
   router.push('/chats/'+data.id); router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'No pudimos crear la conversación.');}
  finally{setBusy(false);}
 }
 if(!workspaceId) return null;
 return <>
  <button type="button" aria-label="Nueva conversación" onClick={()=>setOpen(v=>!v)} style={{position:'absolute',right:18,bottom:74,width:56,height:56,borderRadius:'50%',border:0,background:'var(--text)',color:'#000',fontSize:28,lineHeight:1,cursor:'pointer',zIndex:10,boxShadow:'0 8px 30px #000c'}}>＋</button>
  {open&&<div className="sheet-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <form onSubmit={create} className="sheet" onClick={e=>e.stopPropagation()}>
    <h2>Nueva conversación</h2>
    <p className="hint">Un grupo con las personas de tu espacio. Las IAs se invitan después desde «Mi línea».</p>
    <input type="text" value={title} maxLength={200} required placeholder="Nombre de la conversación" onChange={e=>setTitle(e.target.value)}/>
    {people.length>0&&<ul>{people.map(p=>(
     <li key={p.id}><label><input type="checkbox" checked={members.includes(p.id)} onChange={e=>setMembers(m=>e.target.checked?[...m,p.id]:m.filter(x=>x!==p.id))}/>{p.name}</label></li>
    ))}</ul>}
    {error&&<p role="alert" className="setup-error">{error}</p>}
    <div className="row">
     <button type="button" className="btn btn-ghost" onClick={()=>setOpen(false)}>Cancelar</button>
     <button type="submit" className="btn" disabled={busy||!title.trim()}>{busy?'Creando…':'Crear'}</button>
    </div>
   </form>
  </div>}
 </>;
}
