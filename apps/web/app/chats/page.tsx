import { redirect } from 'next/navigation';
import { ChatView } from '../chat-view';
import { myProfile, ownAuthEnabled } from '../own-auth';
export const dynamic = 'force-dynamic';
export default async function Chats() {
  if (!ownAuthEnabled()) redirect('/sign-in');
  const profile = await myProfile();
  if (!profile) redirect('/sign-in');
  return <ChatView />;
}
