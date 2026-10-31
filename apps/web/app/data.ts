import { apiEnabled, readBackend } from './backend';
import type { CursorPage, Message, Participant, Room } from '../../../packages/contracts/domain';
export interface ChatRepository { source: 'fixture' | 'api'; userId?: string; listRooms(): Promise<CursorPage<Room>>; listMessages(roomId:string): Promise<CursorPage<Message>>; listParticipants(): Promise<CursorPage<Participant>>; }
const workspaceId='fixture-space';
const participants:Participant[]=[{id:'luis',workspaceId,kind:'human',userId:'fixture-luis',displayName:'Luis de la Torre',handle:'luis'},{id:'alix',workspaceId,kind:'ai',ownerUserId:'fixture-luis',displayName:'ALIX',handle:'alix',provider:'chatgpt_work',purpose:'Coordinación',connectionId:null},{id:'acevedo',workspaceId,kind:'human',userId:'fixture-acevedo',displayName:'Acevedo',handle:'acevedo'},{id:'selene',workspaceId,kind:'ai',ownerUserId:'fixture-acevedo',displayName:'Selene',handle:'selene',provider:'chatgpt_work',purpose:'Asistencia',connectionId:null}];
const rooms:Room[]=[{id:'alix',workspaceId,projectId:null,title:'ALIX',kind:'direct',responsePolicy:'direct'},{id:'paradox',workspaceId,projectId:'fixture-paradox',title:'Mesa Paradox',kind:'group',responsePolicy:'mentions_only'}];
const messages:Record<string,Message[]>={alix:[{id:'fixture-1',roomId:'alix',senderParticipantId:'luis',sequence:1,body:'Vamos a organizar IAapp desde la primera conversación.',createdAt:'2026-10-30T17:00:00Z',inReplyTo:null,attachmentIds:[],recipientParticipantIds:['alix']},{id:'fixture-2',roomId:'alix',senderParticipantId:'alix',sequence:2,body:'Primero definamos una sala y los acuerdos que vale la pena conservar.',createdAt:'2026-10-30T17:02:00Z',inReplyTo:'fixture-1',attachmentIds:[],recipientParticipantIds:[]}],paradox:[{id:'fixture-3',roomId:'paradox',senderParticipantId:'luis',sequence:1,body:'Esta mesa reúne a las personas y las IAs que elegimos para el proyecto.',createdAt:'2026-10-30T18:00:00Z',inReplyTo:null,attachmentIds:[],recipientParticipantIds:['alix','selene']}]} ;
const page=<T,>(items:T[]):CursorPage<T>=>({items,nextCursor:null});
export const fixtureRepository:ChatRepository={source:'fixture',async listRooms(){return page(rooms)},async listMessages(id){return page(messages[id]??[])},async listParticipants(){return page(participants)}};
/** Per-request identity: never cache a user's repository globally. */
export async function getRepository():Promise<ChatRepository> {
 if (!apiEnabled()) return fixtureRepository;
 const me=await readBackend<{user:{id:string};workspaces:{id:string}[]}>('/me');
 const workspace=process.env.IAAPP_WORKSPACE_ID ?? me.workspaces[0]?.id;
 if (!workspace || !me.workspaces.some(w=>w.id===workspace)) throw new Error('Aún no tienes una invitación aceptada a este espacio.');
 return {source:'api',userId:me.user.id,
 listRooms:()=>readBackend(`/workspaces/${encodeURIComponent(workspace)}/rooms`),
 listMessages:id=>readBackend(`/rooms/${encodeURIComponent(id)}/messages`),
 listParticipants:()=>readBackend(`/workspaces/${encodeURIComponent(workspace)}/participants`)};
}
