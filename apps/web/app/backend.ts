import 'server-only';
import { auth } from '@clerk/nextjs/server';

export const apiEnabled = () => Boolean(process.env.IAAPP_API_BASE);
export async function backend(path: string, init: RequestInit = {}) {
  const base = process.env.IAAPP_API_BASE;
  if (!base) throw new Error('La conexión de datos todavía no está configurada.');
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY)
    throw new Error('El acceso a tu cuenta todavía no está configurado.');
  const token = await (await auth()).getToken();
  if (!token) throw new Error('Inicia sesión para entrar a tu espacio.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');
  return fetch(`${base.replace(/\/$/, '')}${path}`, {
    ...init, headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
  });
}
export async function readBackend<T>(path: string): Promise<T> {
  const response = await backend(path);
  if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión venció. Vuelve a entrar.' : response.status === 403 ? 'No tienes acceso a este espacio.' : 'No pudimos cargar tus datos. Intenta de nuevo.');
  return response.json();
}
