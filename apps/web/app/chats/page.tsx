'use client';
import Link from 'next/link';
import { useState } from 'react';

const tabs = ['Chats','Contactos','Agentes','Actividad','Perfil'] as const;
type Tab = typeof tabs[number];
export default function Chats() {
  const [tab,setTab] = useState<Tab>('Chats');
  const [search,setSearch] = useState('');
  const [showInfo,setShowInfo] = useState(false);
  return <main className="ia-shell">
    <header className="ia-header"><div className="ia-brand"><span className="ia-mark">▽</span><b>IA.app</b><small>CHAT</small></div><span className="ia-guest">Modo visitante</span></header>
    <section className="ia-main" aria-label={tab}>
      <div className="ia-section"><div className="ia-title"><h1>{tab}</h1><button className="ia-help" onClick={()=>setShowInfo(!showInfo)} aria-label="Información" aria-expanded={showInfo}>ⓘ</button></div>
      {showInfo&&<p className="ia-note">Esta es la entrada pública a IA.app. Los mensajes privados y las conexiones de agentes requieren una cuenta autorizada. No se mostrarán conversaciones inventadas.</p>}
      {(tab==='Chats'||tab==='Contactos'||tab==='Agentes')&&<input value={search} onChange={e=>setSearch(e.target.value)} placeholder={'Buscar '+tab.toLowerCase()} aria-label={'Buscar '+tab.toLowerCase()} />}
      <div className="ia-empty">
      <span className="ia-symbol" aria-hidden="true">{tab==='Chats'?'◎':tab==='Contactos'?'♧':tab==='Agentes'?'◇':tab==='Actividad'?'◌':'◯'}</span>
      <h2>{tab==='Chats'?'Tus conversaciones comienzan aquí':tab==='Contactos'?'Tus contactos':tab==='Agentes'?'Conecta tus inteligencias':tab==='Actividad'?'Tu actividad':'Tu identidad IA.app'}</h2>
      <p>{tab==='Chats'?'Entra con tu identidad para enviar y recibir mensajes reales.':tab==='Contactos'?'Encuentra personas mediante su número IA.app cuando inicies sesión.':tab==='Agentes'?'Vincula proveedores con autorización. Ningún agente aparece como conectado sin comprobarlo.':tab==='Actividad'?'Aquí aparecerán eventos reales de mensajes, grupos y autorizaciones.':'Puedes explorar IA.app sin registrarte. Para mantener tu línea y tus conversaciones, inicia sesión.'}</p>
      {search.trim()&&<p className="ia-search-note">La búsqueda privada estará disponible después de iniciar sesión.</p>}
      <Link className="ia-action" href="/sign-in">Iniciar sesión</Link>
      </div></div>
    </section>
    <nav className="ia-tabs" aria-label="Secciones principales">{tabs.map((t,i)=><button key={t} onClick={()=>{setTab(t);setSearch('');setShowInfo(false)}} className={tab===t?'selected':''} aria-current={tab===t?'page':undefined}><span aria-hidden="true">{['▤','♙','◇','◷','◯'][i]}</span><small>{t}</small></button>)}</nav>
    <style jsx>{`
      .ia-shell{min-height:100dvh;background:#000;color:#f5f5f2;font-family:Arial,Helvetica,sans-serif;display:flex;flex-direction:column}
      .ia-header{height:66px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 22px;border-bottom:1px solid #242426}
      .ia-brand{display:flex;align-items:baseline;gap:9px;font-size:20px;letter-spacing:-.6px}.ia-mark{font-size:25px}.ia-brand small{font-size:9px;letter-spacing:2.8px;color:#a8a8ac}
      .ia-guest{color:#acacaf;font-size:12px}.ia-main{flex:1;min-height:0;padding:30px 20px 105px}
      .ia-section{max-width:760px;margin:auto}.ia-title{display:flex;align-items:center;justify-content:space-between}
      h1{font-size:30px;margin:0 0 25px;letter-spacing:-1px}h2{font-size:21px;letter-spacing:-.5px;margin:0 0 11px;font-weight:600}
      input{box-sizing:border-box;width:100%;padding:14px 17px;border:1px solid #242426;background:#101012;border-radius:12px;color:#fff;font:inherit;outline:none}
      input:focus{border-color:#999}.ia-help{border:0;background:transparent;color:#c9c9c9;font-size:23px;cursor:pointer}
      .ia-note,.ia-search-note{color:#bdbdc2;background:#101012;padding:13px;border-radius:10px;font-size:13px;line-height:1.5}
      .ia-empty{min-height:45vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px 15px}
      .ia-symbol{font-size:42px;color:#c7c7c7;margin-bottom:23px}.ia-empty p{color:#99999e;max-width:340px;font-size:14px;line-height:1.65;margin:0 0 27px}
      .ia-action{background:#f5f5f2;color:#000;padding:13px 23px;border-radius:28px;text-decoration:none;font-size:14px;font-weight:600}
      .ia-tabs{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-around;height:calc(70px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);background:#080809;border-top:1px solid #242426;z-index:10}
      .ia-tabs button{color:#89898c;border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;min-width:58px;padding:8px 0}.ia-tabs button span{font-size:23px}.ia-tabs button small{font-size:10px}.ia-tabs button.selected{color:#f5f5f2}
      @media(min-width:850px){.ia-shell{padding-left:84px}.ia-tabs{right:auto;top:0;width:83px;height:100vh;padding:82px 0 0;box-sizing:border-box;border-top:0;border-right:1px solid #242426;flex-direction:column;justify-content:flex-start;gap:20px}.ia-main{padding:40px}}
    `}</style>
  </main>;
}
