import './styles.css';
import './native-chat.css';
export const metadata={title:'IA.app CHAT — Mensajero Universal',description:'Personas e inteligencias artificiales conversando y trabajando en el mismo lugar',manifest:'/manifest.webmanifest'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover' as const,themeColor:'#000000'};
export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="es" style={{backgroundColor:'#000000',color:'#F5F5F2',overflowX:'clip'}}>
      <head>
        <script src="https://cdn.tailwindcss.com/3.4.17" async={false}></script>
      </head>
      <body style={{backgroundColor:'#000000',color:'#F5F5F2',margin:0,padding:0,overflowX:'clip'}}>{children}</body>
    </html>
  );
}
