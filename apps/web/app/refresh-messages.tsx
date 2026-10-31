'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export function RefreshMessages({active}:{active:boolean}){
 const router=useRouter();
 useEffect(()=>{if(!active)return;const refresh=()=>{if(document.visibilityState==='visible'&&navigator.onLine)router.refresh();};const timer=setInterval(refresh,5000);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);};},[active,router]);
 return null;
}
