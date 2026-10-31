const $ = id => document.getElementById(id);
const state={me:null,rooms:[],room:null,messages:[],nextBefore:null,events:null,sending:false,pending:null};
const mobile=()=>matchMedia('(max-width:740px)').matches;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
async function api(path,options={}){
  const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
  const data=await r.json().catch(()=>({error:'Respuesta inválida'}));
  if(!r.ok)throw Error(data.error||('Error '+r.status));
  return data;
}
const post=(path,data)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function showLogin(message=''){
  state.events?.close();state.events=null;state.me=null;state.room=null;state.messages=[];
  $('loginScreen').hidden=false;$('workspace').hidden=true;$('workspace').classList.remove('open-room');
  $('loginError').textContent=message;
}
function formatTime(timestamp){return new Date(timestamp).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});}
function avatar(name){return (name||'?').trim().slice(0,1).toUpperCase();}
function renderRooms(){
  const q=$('filterRooms').value.trim().toLocaleLowerCase('es');
  const root=$('roomList');root.replaceChildren();
  const list=state.rooms.filter(x=>x.name.toLocaleLowerCase('es').includes(q));
  if(!list.length){root.append(el('p','room-empty',q?'Sin conversaciones coincidentes.':'Todavía no hay conversaciones. Usa + para crear una.'));return;}
  for(const room of list){
    const b=el('button','room-item'+(room.id===state.room?.id?' selected':''));b.type='button';
    const a=el('span','room-avatar'+(room.kind==='group'?' group':''),room.kind==='group'?'✦':avatar(room.name));
    const text=el('span','room-copy');text.append(el('strong','',room.name),el('span','',room.preview||'Sin mensajes todavía'));
    b.append(a,text);b.addEventListener('click',()=>void openRoom(room.id));root.append(b);
  }
}
async function refreshRooms(){
  const data=await api('/api/rooms');state.rooms=data.items;renderRooms();
  if(state.room){const current=state.rooms.find(r=>r.id===state.room.id);if(current){state.room=current;$('roomTitle').textContent=current.name;}}
}
function renderMessages({scroll=false}={}){
  const holder=$('messageList');holder.replaceChildren();
  for(const m of state.messages){
    const mine=m.senderId===state.me.id;
    const outer=el('article','message-row'+(mine?' mine':''));outer.dataset.seq=String(m.seq);
    const bubble=el('div','message-bubble');
    if(!mine)bubble.append(el('p','message-name',m.senderName||'Participante'));
    bubble.append(el('div','message-text',m.body),el('div','message-time',formatTime(m.createdAt)));
    outer.append(bubble);holder.append(outer);
  }
  $('emptyMessages').hidden=state.messages.length>0;
  $('loadOlder').hidden=!state.nextBefore;
  if(scroll)scrollBottom();
}
function scrollBottom(){const sc=$('messagesScroll');requestAnimationFrame(()=>{sc.scrollTop=sc.scrollHeight;});}
function mergeMessages(items){
  const map=new Map(state.messages.map(m=>[m.id,m]));
  for(const m of items)map.set(m.id,m);
  state.messages=[...map.values()].sort((a,b)=>a.seq-b.seq);
}
async function newerMessages(roomId){
  if(!state.room||state.room.id!==roomId)return;
  let after=state.messages.length?state.messages[state.messages.length-1].seq:0;
  let more=true;
  const sc=$('messagesScroll'),nearBottom=sc.scrollHeight-sc.scrollTop-sc.clientHeight<160;
  while(more){
    const data=await api('/api/rooms/'+encodeURIComponent(roomId)+'/messages?after='+after);
    if(state.room?.id!==roomId)return;
    mergeMessages(data.items);
    if(data.items.length)after=data.items[data.items.length-1].seq;
    more=!!data.hasMore&&data.items.length>0;
  }
  renderMessages({scroll:nearBottom});
}
async function openRoom(id,highlight){
  const room=state.rooms.find(x=>x.id===id);
  if(!room)return;
  state.room=room;state.messages=[];state.nextBefore=null;
  sessionStorage.setItem('iachat:last:'+state.me.id,id);
  $('workspace').classList.add('open-room');
  $('noRoom').hidden=true;$('activeRoom').hidden=false;
  $('roomTitle').textContent=room.name;
  $('roomSubtitle').textContent=room.kind==='group'?'Grupo privado':'Conversación privada';
  $('chatAvatar').textContent=room.kind==='group'?'✦':avatar(room.name);
  $('messageInput').value='';updateComposer();$('sendStatus').textContent='Enter para enviar · Shift + Enter para nueva línea';
  renderRooms();
  try{
    const data=await api('/api/rooms/'+encodeURIComponent(id)+'/messages');
    if(state.room?.id!==id)return;
    state.messages=data.items;state.nextBefore=data.nextBefore;
    if(highlight&&!state.messages.some(m=>m.seq===highlight)){
      let loops=0;
      while(state.nextBefore&&loops++<20&&!state.messages.some(m=>m.seq===highlight)){
        const old=await api('/api/rooms/'+encodeURIComponent(id)+'/messages?before='+state.nextBefore);
        if(state.room?.id!==id)return;
        mergeMessages(old.items);state.nextBefore=old.nextBefore;
      }
    }
    renderMessages({scroll:!highlight});
    if(highlight){
      const target=$('messageList').querySelector('[data-seq="'+String(highlight)+'"]');
      if(target)target.scrollIntoView({block:'center',behavior:'smooth'});
    }
    if(!mobile())$('messageInput').focus();
  }catch(e){$('sendStatus').textContent=e.message;}
}
async function loadOlder(){
  if(!state.room||!state.nextBefore)return;
  const id=state.room.id,scroll=$('messagesScroll'),height=scroll.scrollHeight,top=scroll.scrollTop;
  const data=await api('/api/rooms/'+encodeURIComponent(id)+'/messages?before='+state.nextBefore);
  if(state.room?.id!==id)return;
  mergeMessages(data.items);state.nextBefore=data.nextBefore;renderMessages();
  requestAnimationFrame(()=>{scroll.scrollTop=scroll.scrollHeight-height+top;});
}
function connectLive(){
  state.events?.close();
  const stream=new EventSource('/api/events',{withCredentials:true});state.events=stream;
  const indicator=$('connectionState');
  stream.addEventListener('ready',()=>{indicator.textContent='Conectado';indicator.classList.add('connected');void refreshRooms().then(()=>state.room&&newerMessages(state.room.id)).catch(()=>{});});
  stream.addEventListener('message',e=>{try{const data=JSON.parse(e.data);void refreshRooms().catch(()=>{});if(data.room===state.room?.id)void newerMessages(data.room).catch(()=>{});}catch{}});
  stream.onerror=()=>{indicator.textContent='Reconectando…';indicator.classList.remove('connected');};
}
async function boot(){
  try{
    const me=await api('/api/me');state.me=me.user;
    $('profileName').textContent=state.me.displayName;
    $('loginScreen').hidden=true;$('workspace').hidden=false;
    await refreshRooms();
    const previous=sessionStorage.getItem('iachat:last:'+state.me.id);
    if(previous&&state.rooms.some(x=>x.id===previous))await openRoom(previous);
    connectLive();
  }catch{showLogin();}
}
async function sendMessage(){
  if(state.sending||!state.room)return;
  const input=$('messageInput'),body=input.value.trim();
  if(!body)return;
  if(!state.pending||state.pending.body!==body)state.pending={body,key:crypto.randomUUID()};
  state.sending=true;$('sendButton').disabled=true;$('sendStatus').textContent='Guardando mensaje…';
  const roomId=state.room.id;
  try{
    const data=await post('/api/rooms/'+encodeURIComponent(roomId)+'/messages',state.pending);
    state.pending=null;input.value='';updateComposer();
    if(state.room?.id===roomId){mergeMessages([data.message]);renderMessages({scroll:true});}
    $('sendStatus').textContent='Mensaje guardado';
    await refreshRooms();
  }catch(e){$('sendStatus').textContent=e.message+' · Tu borrador sigue aquí.';}
  finally{state.sending=false;updateComposer();}
}
function updateComposer(){
  const input=$('messageInput');input.style.height='auto';input.style.height=Math.min(170,Math.max(45,input.scrollHeight))+'px';
  $('sendButton').disabled=state.sending||!input.value.trim();
}
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();$('loginButton').disabled=true;$('loginError').textContent='';
  try{await post('/api/login',{username:$('username').value,password:$('password').value});$('password').value='';await boot();}
  catch(err){$('loginError').textContent=err.message;}
  finally{$('loginButton').disabled=false;}
});
$('logoutButton').addEventListener('click',async()=>{try{await post('/api/logout',{});}finally{if(state.me)sessionStorage.removeItem('iachat:last:'+state.me.id);showLogin();}});
$('backButton').addEventListener('click',()=>{$('workspace').classList.remove('open-room');if(state.me)sessionStorage.removeItem('iachat:last:'+state.me.id);state.room=null;renderRooms();});
$('refreshButton').addEventListener('click',()=>state.room&&void newerMessages(state.room.id));
$('filterRooms').addEventListener('input',renderRooms);
$('loadOlder').addEventListener('click',()=>void loadOlder().catch(e=>$('sendStatus').textContent=e.message));
$('messageInput').addEventListener('input',updateComposer);
$('messageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!mobile()){e.preventDefault();void sendMessage();}});
$('composeForm').addEventListener('submit',e=>{e.preventDefault();void sendMessage();});
$('newRoomButton').addEventListener('click',()=>{$('roomError').textContent='';$('newRoomDialog').showModal();});
$('roomKind').addEventListener('change',()=>{$('groupNameLabel').hidden=$('roomKind').value!=='group';$('peerNames').placeholder=$('roomKind').value==='group'?'usuario1, usuario2':'usuario';});
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());
$('newRoomForm').addEventListener('submit',async e=>{
  e.preventDefault();$('roomError').textContent='';
  const kind=$('roomKind').value,names=$('peerNames').value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  try{
    const v=kind==='direct'?{kind,peer:names[0]}:{kind,name:$('groupName').value,members:names};
    const data=await post('/api/rooms',v);
    $('newRoomDialog').close();$('newRoomForm').reset();$('groupNameLabel').hidden=true;
    await refreshRooms();await openRoom(data.roomId);
  }catch(err){$('roomError').textContent=err.message;}
});
$('globalSearchButton').addEventListener('click',()=>{$('searchResults').replaceChildren();$('searchDialog').showModal();});
$('searchForm').addEventListener('submit',async e=>{
  e.preventDefault();const target=$('searchResults');target.replaceChildren(el('p','hint','Buscando…'));
  try{
    const data=await api('/api/search?q='+encodeURIComponent($('searchQuery').value));
    target.replaceChildren();
    if(!data.items.length){target.append(el('p','hint','No hay coincidencias.'));return;}
    for(const m of data.items){
      const b=el('button','result-button');b.type='button';
      b.append(el('small','',m.roomName+' · '+m.senderName),el('span','',m.body));
      b.addEventListener('click',async()=>{$('searchDialog').close();await refreshRooms();await openRoom(m.roomId,m.seq);});
      target.append(b);
    }
  }catch(err){target.replaceChildren(el('p','form-error',err.message));}
});
window.addEventListener('online',()=>{if(state.me)void refreshRooms().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.me){void refreshRooms().catch(()=>{});if(state.room)void newerMessages(state.room.id).catch(()=>{});}});
void boot();
