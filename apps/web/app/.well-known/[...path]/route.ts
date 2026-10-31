import {proxyOwn} from '../../own-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{path:string[]}>}){
 const route=(await context.params).path.join('/');
 if(!['oauth-protected-resource/mcp','oauth-authorization-server/api/auth','openid-configuration/api/auth'].includes(route))return new Response(null,{status:404});
 return proxyOwn(request,'/.well-known/'+route);
}
