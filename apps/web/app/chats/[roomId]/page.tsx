import { redirect } from 'next/navigation';
import { ChatView } from '../../chat-view';
import { myProfile, ownAuthEnabled } from '../../own-auth';
export const dynamic = 'force-dynamic';
export default async function RoomPage({params}:{params:Promise<{roomId:string}>}) {
  if (!ownAuthEnabled()) redirect('/sign-in');
  const profile = await myProfile();
  if (!profile) redirect('/sign-in');
  const {roomId}=await params;
  return <ChatView roomId={roomId} />;
}
