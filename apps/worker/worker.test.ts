import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryOutcome, runOnce, type WorkerRepository, type Outcome } from './worker.ts';
import { seal } from '../api/src/mcp/security.ts';

test('2xx never means a response; 410 and 413 never retry; retries are bounded', () => {
  assert.equal(deliveryOutcome(202, 1, 0, 999999).state, 'received_by_host');
  assert.deepEqual(deliveryOutcome(410, 1, 0, 999999), { state: 'expired', code: 'CALLBACK_GONE', status: 410, expireSubscription: true });
  assert.equal(deliveryOutcome(413, 1, 0, 999999).state, 'failed');
  assert.equal(deliveryOutcome(302, 1, 0, 999999).state, 'failed');
  assert.equal(deliveryOutcome(401, 1, 0, 999999).state, 'failed');
  assert.equal(deliveryOutcome(429, 1, 0, 999999, () => 0).nextAttemptAt, 500);
  assert.equal(deliveryOutcome(503, 8, 0, 999999).code, 'RETRIES_EXHAUSTED');
  assert.equal(deliveryOutcome(null, 2, 0, 100).state, 'expired');
});
test('worker preserves exact event and capability across retries, signs freshly, and gates access', async () => {
  const key = Buffer.alloc(32, 5), secret = 'whsec_' + Buffer.alloc(32, 4).toString('base64');
  const event = { eventId: 'event-a', name: 'message.created', timestamp: '2026-10-30T12:00:00Z', data: { deliveryId: 'delivery-a', messageId: 'message-a', roomId: 'room-a', recipientParticipantId: 'ai-a', summary: 'hello', replyCapability: 'cap-a' }, cursor: null };
  const subscription = { id: 'sub-a', identityKey: 'identity-a', connectionId: 'binding-a', generation: 1, url: 'https://host/cb', encryptedSecret: seal(secret, key, 'sub-a'), expiresAt: 999999, verifiedAt: 0 };
  const row = { id: 'delivery-a', leaseToken: 'lease-a', attempts: 1, expiresAt: 999999, encryptedEvent: seal(JSON.stringify(event), key, 'delivery-a'), subscription };
  let allowed = true, time = 10000; const outcomes: Outcome[] = [], requests: any[] = [];
  const repository: WorkerRepository = {
    leaseNext: async () => row,
    authorizeLease: async () => allowed ? subscription : null,
    finish: async (id, lease, outcome) => { assert.equal(id, 'delivery-a'); assert.equal(lease, 'lease-a'); outcomes.push(outcome); },
  };
  const post = async (_url: string, headers: any, body: string) => { requests.push({ headers, body }); return { status: requests.length === 1 ? 503 : 202, body: '' }; };
  await runOnce(repository, post, key, () => time);
  row.attempts++; time += 10000;
  await runOnce(repository, post, key, () => time);
  assert.equal(requests[0].body, requests[1].body);
  assert.equal(requests[0].headers['webhook-id'], 'event-a');
  assert.notEqual(requests[0].headers['webhook-signature'], requests[1].headers['webhook-signature']);
  assert.equal(outcomes[0].state, 'queued'); assert.equal(outcomes[1].state, 'received_by_host');
  allowed = false;
  await runOnce(repository, post, key, () => time);
  assert.equal(requests.length, 2); assert.equal(outcomes[2].state, 'cancelled');
  assert.equal(await runOnce({ ...repository, leaseNext: async () => null }, post, key), false);
});
