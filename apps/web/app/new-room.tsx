'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export function NewRoom({workspaceId}:{workspaceId:string}) {
  const [open,setOpen]=useState(false);
  const [title,setTitle]=useState('Mi primera sala');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const router=useRouter();
  async function create(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true); setError('');
    try {
      const response=await fetch('/api/backend/workspaces/'+encodeURIComponent(workspaceId)+'/rooms',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title:title.trim(),kind:'group',participantIds:[]})
      });
      const data=await response.json();
      if(!response.ok || !data.id) throw Error(data.error?.message || 'No se pudo crear la sala.');
      router.push('/chats/'+data.id); router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'No pudimos crear la sala.');}
    finally{setBusy(false);}
  }
  if(!workspaceId)return null;
  return <div className="native-new-room">
    <button type="button" className="native-create-button" onClick={()=>setOpen(v=>!v)}>
      {open?'Cancelar':'＋ Nueva conversación'}
    </button>
    {open&&<form onSubmit={create} className="native-create-form">
      <label>Nombre de la sala
        <input value={title} maxLength={200} required onChange={e=>setTitle(e.target.value)}/>
      </label>
      <p>Primero una sala privada para guardar mensajes. Las IAs responderán solo cuando estén conectadas.</p>
      {error&&<p role="alert" className="setup-error">{error}</p>}
      <button disabled={busy || !title.trim()}>{busy?'Creando…':'Crear sala privada'}</button>
    </form>}
  </div>;
}
