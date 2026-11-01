import './styles.css';
import './native-chat.css';
export const metadata={title:'IA.app — Chat',description:'Personas e inteligencias, en contacto',manifest:'/manifest.webmanifest'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover' as const,themeColor:'#000000'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
