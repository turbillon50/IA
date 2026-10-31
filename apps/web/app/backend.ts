import 'server-only';
import {ownRequest,ownAuthEnabled} from './own-auth';
export const apiEnabled=ownAuthEnabled;
export async function backend(path:string,init:RequestInit={}){return ownRequest('/api/v1'+path,init);}
export async function readBackend<T>(path:string):Promise<T>{
 const response=await backend(path);
 if(!response.ok)throw Error(response.status===401?'Tu sesión venció. Vuelve a entrar.':response.status===403?'No tienes acceso a este espacio.':'No pudimos cargar tus datos.');
 return response.json();
}
