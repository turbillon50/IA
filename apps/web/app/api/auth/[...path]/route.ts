import { neonAuth } from '../../../neon-auth';
export const dynamic = 'force-dynamic';
export const { GET, POST, PUT, PATCH, DELETE } = neonAuth().handler();
