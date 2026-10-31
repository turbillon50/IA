import {proxyOwn} from '../../own-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:{params:Promise<{path:string[]}>}){
 const route=(await context.params).path.join('/');
 if(route==='sign-in')return Response.redirect(new URL('/sign-in'+new URL(request.url).search,request.url));
 if(route==='account')return Response.redirect(new URL('/alta',request.url));
 if(!['consent','profile'].includes(route))return new Response(null,{status:404});
 return proxyOwn(request,'/auth/'+route);
}
