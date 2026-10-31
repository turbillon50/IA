/** IAapp contract v1.0. Domain proposal; not a running backend. */
export type ID = string;
export type ISODate = string;
export type UserRole = 'owner' | 'admin' | 'member';
export type ConnectionState = 'draft' | 'awaiting_authorization' | 'awaiting_subscription' | 'awaiting_probe' | 'ready' | 'paused' | 'expired' | 'revoked' | 'error';
export type DeliveryState = 'queued' | 'sending' | 'received_by_host' | 'reply_received' | 'failed' | 'expired' | 'paused' | 'cancelled';
export type RoomKind = 'direct' | 'group';
export type ResponsePolicy = 'direct' | 'mentions_only';
export interface User { id: ID; displayName: string; handle: string; }
export interface ExternalIdentity { userId: ID; issuer: string; clientId: string; subject: string; }
export interface Workspace { id: ID; name: string; visibility: 'invite_only'; }
export interface WorkspaceMembership { workspaceId: ID; userId: ID; role: UserRole; }
export interface HumanParticipant { id: ID; workspaceId: ID; kind: 'human'; userId: ID; displayName: string; handle: string; }
export interface AIParticipant { id: ID; workspaceId: ID; kind: 'ai'; ownerUserId: ID; displayName: string; handle: string; provider: 'chatgpt_work'; purpose: string; connectionId: ID | null; }
export type Participant = HumanParticipant | AIParticipant;
/** Private origin URLs and token material never appear in this shared DTO. */
export interface ConnectionSummary { id: ID; participantId: ID; state: ConnectionState; generation: number; verifiedAt: ISODate | null; lastErrorCode: string | null; }
export interface Project { id: ID; workspaceId: ID; title: string; goal: string; status: 'active' | 'archived'; }
export interface Room { id: ID; workspaceId: ID; projectId: ID | null; title: string; kind: RoomKind; responsePolicy: ResponsePolicy; }
export interface RoomMember { roomId: ID; participantId: ID; joinedAt: ISODate; leftAt: ISODate | null; }
export interface Attachment { id: ID; roomId: ID; fileName: string; contentType: string; bytes: number; state: 'processing' | 'ready' | 'rejected'; }
export interface Message { id: ID; roomId: ID; senderParticipantId: ID; sequence: number; body: string; createdAt: ISODate; inReplyTo: ID | null; attachmentIds: ID[]; recipientParticipantIds: ID[]; }
/** Sender is derived server-side. An unauthenticated sender argument is prohibited. */
export interface SendMessageInput { body: string; recipientParticipantIds: ID[]; attachmentIds: ID[]; }
export interface Delivery { id: ID; messageId: ID; recipientParticipantId: ID; state: DeliveryState; attempts: number; receivedByHostAt: ISODate | null; responseMessageId: ID | null; lastErrorCode: string | null; }
export interface MemoryEntry { id: ID; workspaceId: ID; scope: { kind: 'room' | 'project'; id: ID }; title: string; body: string; category: 'agreement' | 'criterion' | 'decision'; authorParticipantId: ID; sourceMessageId: ID | null; version: number; updatedAt: ISODate; }
export interface Task { id: ID; projectId: ID; title: string; assignedParticipantId: ID | null; status: 'todo' | 'doing' | 'done'; }
export interface CursorPage<T> { items: T[]; nextCursor: string | null; }
export interface APIError { error: { code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'RATE_LIMITED' | 'CONNECTION_UNAVAILABLE' | 'RETRYABLE'; message: string; requestId: string; retryAfterSeconds?: number; }; }
/** Server-to-host only. Never pass replyCapability to PWA clients or logs. */
export interface MessageCreatedEvent { eventId: ID; name: 'message.created'; timestamp: ISODate; data: { deliveryId: ID; messageId: ID; roomId: ID; recipientParticipantId: ID; summary: string; replyCapability: string; }; cursor: string | null; }
export interface RespondToDeliveryInput { deliveryId: ID; replyCapability: string; body: string; idempotencyKey: string; }
export interface PairingChallenge { id: ID; code: string; expiresAt: ISODate; participantId: ID; }
