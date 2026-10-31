import type { Principal } from './security.ts';

export interface Binding {
  id: string; ownerUserId: string; participantId: string; generation: number;
  state: 'awaiting_subscription' | 'awaiting_probe' | 'ready' | 'paused' | 'expired' | 'revoked';
}
export interface Subscription {
  id: string; identityKey: string; connectionId: string; generation: number;
  url: string; encryptedSecret: string; expiresAt: number; verifiedAt: number;
  previousEncryptedSecret?: string; rotationExpiresAt?: number;
}
/** Backend implementation is required. No memory fallback is allowed in production.
 * Every mutation locks the connection row and checks current owner, grant,
 * generation and membership inside the same DB transaction as its writes.
 * See INTEGRATION.md for atomicity and uniqueness requirements.
 */
export interface McpRepository {
  getOwnedBinding(principal: Principal, participantId: string): Promise<Binding | null>;
  getSubscription(id: string): Promise<Subscription | null>;
  /** Store only hash(code); generate new generation and invalidate old capabilities. */
  createPairing(ownerUserId: string, participantId: string, codeHash: string, expiresAt: number): Promise<{ id: string }>;
  /** Atomic compare-and-consume; same owner, expiry, attempts limit, one use. */
  claimPairing(principal: Principal, codeHash: string, now: number): Promise<Binding>;
  /** CAS generation/state; unique live subscription per binding; persist encrypted secret.
   * Refresh must preserve readiness; changed callback requires a new pairing.
   * Atomically enqueue one probe for a newly verified binding, using message.created
   * and the shared payload shape. Probe capabilities are never exposed to REST.
   */
  saveSubscription(principal: Principal, binding: Binding, subscription: Subscription): Promise<void>;
  stopSubscription(principal: Principal, subscriptionId: string): Promise<void>;
  /** Owner action; pause cancels leases, revoke/expire invalidates all capabilities. */
  setConnectionState(ownerUserId: string, connectionId: string, state: 'paused' | 'revoked' | 'expired'): Promise<void>;
  /** Transactionally checks every capability binding + current room membership.
   * Hash and constant-time compare capability; expiry; connection generation;
   * subscription active; OAuth identity matches; delivery kind probe iff confirm.
   * Consume capability + insert message + close delivery atomically, no fanout.
   * Same key/body retry returns original result, altered retry returns CONFLICT.
   * confirmPairing sets ready only in this transaction, never on HTTP receipt.
   */
  completeDelivery(principal: Principal, input: {
    deliveryId: string; capabilityHash: string; body: string;
    idempotencyKey: string; requestHash: string; confirmPairing: boolean; now: number;
  }): Promise<{ messageId: string; deliveryId: string }>;
}
