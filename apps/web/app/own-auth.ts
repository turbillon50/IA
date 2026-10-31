import 'server-only';
import { cookies } from 'next/headers';
export const ownAuthEnabled=()=>Boolean(process.env.IAAPP_AUTH_UPSTREAM);
export function upstream(path:string){
 const base=process.env.IAAPP_AUTH_UPSTREAM;
 if(!base)throw Error('El acceso de IAapp todavía no está disponible.');
 const url=new URL(base);
 if(url.username||url.password||url.search||url.hash||(url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='127.0.0.1')))throw Error('Configuración de acceso inválida.');
 return base.replace(/\/$/,'')+path;
}
export async function ownRequest(path:string,init:RequestInit={}){
 const headers=new Headers(init.headers);
 headers.set('Cookie',(await cookies()).toString());headers.set('Accept','application/json');
 return fetch(upstream(path),{...init,headers,cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(15000)});
}
export async function myProfile(){
 const r=await ownRequest('/auth/profile');if(r.status===401)return null;
 if(!r.ok)throw Error('No pudimos cargar tu línea.');
 return r.json() as Promise<{userId:string;lineNumber:string;displayName:string}>;
}
export async function proxyOwn(request:Request,path:string){
 if(!ownAuthEnabled())return Response.json({error:'Acceso temporalmente no disponible.'},{status:503});
 const incoming=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method)&&request.headers.get('origin')&&request.headers.get('origin')!==incoming.origin)return Response.json({error:'Origen no autorizado.'},{status:403});
 const body=['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer();
 if(body&&body.byteLength>65536)return new Response(null,{status:413});
 const headers=new Headers();
 for(const key of ['cookie','authorization','content-type','accept','origin','mcp-protocol-version','mcp-session-id']){const v=request.headers.get(key);if(v)headers.set(key,v);}
 try{
  const r=await fetch(upstream(path+incoming.search),{method:request.method,headers,body,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const out=new Headers({'Cache-Control':'no-store'});
  for(const key of ['content-type','location','www-authenticate','content-security-policy','x-content-type-options']){const v=r.headers.get(key);if(v)out.set(key,v);}
  for(const cookie of r.headers.getSetCookie())out.append('Set-Cookie',cookie);
  return new Response(r.body,{status:r.status,headers:out});
 }catch{return Response.json({error:'No pudimos conectar con IAapp. Intenta de nuevo.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
