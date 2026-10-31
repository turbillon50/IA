import { signedHeaders, unseal } from '../api/src/mcp/security.ts';
import type { Subscription } from '../api/src/mcp/ports.ts';
import type { WebhookPost } from '../api/src/mcp/webhook.ts';
import type { MessageCreatedEvent } from '../../packages/contracts/domain.ts';

export interface LeasedDelivery {
  id: string; leaseToken: string; attempts: number; expiresAt: number;
  /** Encrypted envelope to preserve reply capability and eventId across retries. */
  encryptedEvent: string; subscription: Subscription;
}
export type Outcome = {
  state: 'received_by_host' | 'queued' | 'failed' | 'expired' | 'cancelled';
  code: string | null; status: number | null; nextAttemptAt?: number; expireSubscription?: boolean;
};
export interface WorkerRepository {
  /** SELECT FOR UPDATE SKIP LOCKED; recover expired leases; attempts++.
   * Lease must exceed network timeout (recommended 60s). Never claim terminal,
   * paused, received_by_host, expired, revoked or unauthorized deliveries.
   */
  leaseNext(now: number, leaseMs: number): Promise<LeasedDelivery | null>;
  /** Recheck binding generation, OAuth grant, room membership, subscription and lease.
   * Return current subscription/secret snapshot to avoid stale refresh snapshots.
   */
  authorizeLease(id: string, leaseToken: string, now: number): Promise<Subscription | null>;
  /** CAS leaseToken; do not overwrite reply_received from a racing tool callback.
   * Persist delivery_attempts + outcome atomically; 410 also expires connection,
   * subscription and capabilities. Never include payloads, secrets or URLs in logs.
   */
  finish(id: string, leaseToken: string, outcome: Outcome, now: number): Promise<void>;
}
export function deliveryOutcome(status: number | null, attempts: number, now: number, expiresAt: number, random = Math.random): Outcome {
  if (status !== null && status >= 200 && status < 300) return { state: 'received_by_host', code: null, status };
  if (status === 410) return { state: 'expired', code: 'CALLBACK_GONE', status, expireSubscription: true };
  if (status === 413) return { state: 'failed', code: 'PAYLOAD_TOO_LARGE', status };
  const transient = status === null || status === 408 || status === 429 || (status >= 500 && status <= 599);
  if (!transient || attempts >= 8) return { state: 'failed', code: transient ? 'RETRIES_EXHAUSTED' : 'CALLBACK_REJECTED', status };
  const nextAttemptAt = now + Math.floor(Math.min(300000, 1000 * 2 ** Math.max(0, attempts - 1)) * (0.5 + random() * 0.5));
  if (nextAttemptAt >= expiresAt) return { state: 'expired', code: 'DELIVERY_EXPIRED', status };
  return { state: 'queued', code: 'RETRYABLE', status, nextAttemptAt };
}
export async function runOnce(repository: WorkerRepository, post: WebhookPost, key: Buffer, now = Date.now): Promise<boolean> {
  const delivery = await repository.leaseNext(now(), 60000);
  if (!delivery) return false;
  const subscription = await repository.authorizeLease(delivery.id, delivery.leaseToken, now());
  if (!subscription || delivery.expiresAt <= now() || subscription.expiresAt <= now()) {
    await repository.finish(delivery.id, delivery.leaseToken, { state: 'cancelled', code: 'CONNECTION_UNAVAILABLE', status: null }, now()); return true;
  }
  let outcome: Outcome;
  try {
    const body = unseal(delivery.encryptedEvent, key, delivery.id);
    if (Buffer.byteLength(body) > 262144) {
      outcome = { state: 'failed', code: 'PAYLOAD_TOO_LARGE', status: null };
    } else {
      const event = JSON.parse(body) as MessageCreatedEvent;
      if (event.name !== 'message.created' || event.data.deliveryId !== delivery.id || typeof event.eventId !== 'string') throw new Error('INVALID_STORED_EVENT');
      const secrets = [unseal(subscription.encryptedSecret, key, subscription.id)];
      if (subscription.previousEncryptedSecret && (subscription.rotationExpiresAt ?? 0) > now()) secrets.push(unseal(subscription.previousEncryptedSecret, key, subscription.id));
      const response = await post(subscription.url, signedHeaders(event.eventId, subscription.id, body, secrets, now()), body);
      outcome = deliveryOutcome(response.status, delivery.attempts, now(), delivery.expiresAt);
    }
  } catch {
    outcome = deliveryOutcome(null, delivery.attempts, now(), delivery.expiresAt);
  }
  await repository.finish(delivery.id, delivery.leaseToken, outcome, now());
  return true;
}
/** Deployment calls runOnce in its supervised loop; no in-process queue is used. */
