import Link from 'next/link';
import { Avatar, EmptyState, Mark } from '@iaapp/ui';
import { getRepository } from './data';
import { RefreshMessages } from './refresh-messages';
import { Composer } from './composer';
import { NewRoom } from './new-room';
export async function ChatView({roomId}:{roomId?:string}) {
 const repository=await getRepository();
 const [roomsPage,peoplePage]=await Promise.all([repository.listRooms(),repository.listParticipants()]);
 const rooms=roomsPage.items, people=peoplePage.items;
 const selected=rooms.find(r=>r.id===roomId);
 const messages=selected?(await repository.listMessages(selected.id)).items:[];
 const person=(id:string)=>people.find(p=>p.id===id);
 const time=(iso:string)=>new Date(iso).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',timeZone:'America/Cancun'});
 return <div className={`app ${roomId?'room-open':''}`}>
  <div className="wa">
   <aside className="list" aria-label="Conversaciones">
    <header className="list-head">
     <span className="brand"><Mark size={22}/><b>IA.app</b><small>CHAT</small></span>
     <span className="grow"/>
     {repository.source==='fixture'&&<span className="chip-preview">VISTA PREVIA</span>}
    </header>
    <div className="rooms">
     {rooms.length?rooms.map(r=>{
      const isDirect=r.kind==='direct';
      return <Link key={r.id} href={`/chats/${r.id}`} className={`room ${selected?.id===r.id?'selected':''}`}>
       <Avatar name={r.title} kind={isDirect?'ai':'human'} size={50}/>
       <span className="room-copy">
        <strong>{r.title}</strong>
        <small>{isDirect?<span className="tag-ia">IA</span>:null}{isDirect?'Conversación con una IA':'Grupo'}</small>
       </span>
      </Link>;}):<EmptyState title="Aún no hay conversaciones">Crea una para empezar. Solo las personas de tu espacio la verán.</EmptyState>}
    </div>
    <div className="list-foot"><span>Espacio privado · Por invitación</span><Link href="/alta">Mi línea</Link></div>
    <NewRoom workspaceId={people[0]?.workspaceId ?? rooms[0]?.workspaceId ?? ''} people={people.filter(p=>p.kind==='human').map(p=>({id:p.id,name:p.displayName}))}/>
   </aside>
   <main className="chat">
    {selected?<>
     <header className="chat-head">
      <Link className="back" href="/chats" aria-label="Volver">‹</Link>
      <Avatar name={selected.title} kind={selected.kind==='direct'?'ai':'human'} size={40}/>
      <div className="who"><strong>{selected.title}</strong><span className="sub">{selected.kind==='direct'?'Conversación con una IA':'Grupo'}</span></div>
     </header>
     <div className="chat-body" id="messages">
      <span className="day">{repository.source==='fixture'?'EJEMPLO':'CONVERSACIÓN PRIVADA'}</span>
      {messages.length?messages.sort((a,b)=>a.sequence-b.sequence).map(m=>{
       const p=person(m.senderParticipantId);
       const mine=repository.source==='fixture'?m.senderParticipantId==='luis':p?.kind==='human'&&p.userId===repository.userId;
       return <article key={m.id} className={`message ${mine?'mine':''}`}>
        {!mine&&selected.kind==='group'&&<span className="msg-author">{p?.displayName??'Participante'}</span>}
        <div className="bubble">{m.body}<span className="stamp">{time(m.createdAt)}</span></div>
       </article>;}) : <EmptyState title="Sin mensajes todavía">Escribe el primero abajo.</EmptyState>}
     </div>
     <RefreshMessages active={repository.source==='api'}/>
     <Composer key={selected.id} source={repository.source} roomId={selected.id} direct={selected.kind==='direct'} targets={people.filter(p=>p.kind==='ai').map(p=>({id:p.id,name:p.displayName}))}/>
    </>:<EmptyState title={roomId?'Conversación no disponible':'Elige una conversación'}>{roomId?'Revisa el enlace o vuelve a tu bandeja.':'Selecciona una de la lista o crea una nueva.'} <Link href="/chats">Bandeja</Link></EmptyState>}
   </main>
  </div>
 </div>;
}
