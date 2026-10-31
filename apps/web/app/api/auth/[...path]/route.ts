import {proxyOwn} from '../../../own-auth';
export const dynamic='force-dynamic';
async function proxy(request:Request,context:{params:Promise<{path:string[]}>}){
 const route=(await context.params).path.join('/');
 if(!/^(get-session|sign-in\/email|sign-out|jwks|oauth2\/(authorize|token|consent|continue|userinfo))$/.test(route))return new Response(null,{status:404});
 return proxyOwn(request,'/api/auth/'+route);
}
export {proxy as GET,proxy as POST};
