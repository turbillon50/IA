import './styles.css';
import { ClerkProvider } from '@clerk/nextjs';
export const metadata = { title: 'IAapp — Conversaciones', description: 'Personas e inteligencias, en contacto', manifest: '/manifest.webmanifest' };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const, themeColor: '#08090b' };
export default function RootLayout({children}:{children:React.ReactNode}) { const configured=!process.env.NEON_AUTH_BASE_URL && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY; return <html lang="es"><body>{configured ? <ClerkProvider signInUrl="/sign-in">{children}</ClerkProvider> : children}</body></html>; }
