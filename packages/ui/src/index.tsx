import type { ReactNode } from 'react';
export function Avatar({name,kind='human',size=44}:{name:string;kind?:'human'|'ai';size?:number}){
 const initials=(name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()??'').join('')||'?';
 return <span className={`avatar ${kind==='ai'?'ai':''}`} style={{width:size,height:size,fontSize:Math.round(size*0.34)}} aria-hidden="true">{initials}{kind==='ai'&&<small>IA</small>}</span>;
}
export function Badge({children}:{children:ReactNode}){return <span className="badge">{children}</span>;}
export function EmptyState({title,children}:{title:string;children?:ReactNode}){
 return <div className="empty"><h2>{title}</h2>{children&&<p>{children}</p>}</div>;
}
export function Mark({size=28}:{size?:number}){return <svg className="mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L21.5 20 L2.5 20 Z" fill="currentColor"/></svg>;}
