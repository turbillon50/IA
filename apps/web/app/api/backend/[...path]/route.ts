import { backend } from '../../../backend';
export const dynamic = 'force-dynamic';
const allowed = /^(me|bootstrap|workspaces\/[\w-]+\/(rooms|participants|participants\/ai|projects)|rooms\/[\w-]+\/(messages|membership\/accept)|messages\/[\w-]+\/deliveries|projects\/[\w-]+(\/tasks)?|tasks\/[\w-]+|memory(\/[\w-]+(\/versions)?)?|participants\/[\w-]+\/(connection|pairing))$/;
async function proxy(request: Request, context: {params: Promise<{path:string[]}>}) {
  const {path} = await context.params;
  const route = path.join('/');
  if (!allowed.test(route)) return Response.json({error:{message:'Ruta no disponible'}},{status:404});
  if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({error:{message:'Origen no autorizado'}},{status:403});
  const body = request.method === 'GET' ? undefined : await request.text();
  if (body && new TextEncoder().encode(body).length > 65536) return new Response(null,{status:413});
  try {
    const headers = new Headers();
    if(body) headers.set('Content-Type','application/json');
    const key=request.headers.get('idempotency-key');
    if(key) headers.set('Idempotency-Key',key);
    const response=await backend(`/${route}${new URL(request.url).search}`,{method:request.method,headers,body});
    return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:{message:'No se pudo conectar. Comprueba tu sesión e intenta de nuevo.'}},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
export {proxy as GET, proxy as POST, proxy as PATCH};
