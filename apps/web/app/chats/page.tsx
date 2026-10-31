import { ChatView } from '../chat-view';
import { redirect } from 'next/navigation';
export default function Chats(){ if(process.env.NEON_AUTH_BASE_URL) redirect('/alta'); return <ChatView />; }
