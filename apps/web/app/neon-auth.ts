import 'server-only';
import { createNeonAuth } from '@neon/auth/next/server';

export function neonAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) throw new Error('Neon Auth no está configurado');
  return createNeonAuth({ baseUrl, cookies: { secret } });
}
