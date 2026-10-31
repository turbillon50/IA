import {proxyOwn} from '../own-auth';
export const dynamic='force-dynamic';
const proxy=(request:Request)=>proxyOwn(request,'/mcp');
export {proxy as GET,proxy as POST,proxy as DELETE};
