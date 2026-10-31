import './styles.css';
export const metadata={title:'IAapp — Conversaciones',description:'Personas e inteligencias, en contacto',manifest:'/manifest.webmanifest'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover' as const,themeColor:'#08090b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
