'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mark } from '@iaapp/ui';
export function SplashGate(){
 const router=useRouter();
 const [going,setGoing]=useState(false);
 async function begin(){
  if(going)return; setGoing(true);
  let target='/sign-in';
  try{
   const r=await fetch('/api/auth/get-session',{cache:'no-store'});
   if(r.ok){const s=await r.json();if(s&&s.user)target='/chats';}
  }catch{}
  router.push(target);
 }
 return <button type="button" className="splash" onClick={begin} aria-label="Toque para comenzar">
  <Mark size={46}/>
  <span className="word">IA.app</span>
  <span className="kicker">CHAT</span>
  <span className="tap">{going?'ENTRANDO…':'TOCA PARA COMENZAR'}</span>
 </button>;
}
