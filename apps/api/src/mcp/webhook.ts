import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { equal, signedHeaders, token } from './security.ts';

/** Deliberately conservative: only ordinary globally routed addresses. */
export function publicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(ip) === 6) {
    // Avoid mapped IPv4, translation, Teredo, 6to4 and special-purpose 2001::/23.
    const first = parseInt(ip.split(':')[0], 16), second = parseInt(ip.split(':')[1] || '0', 16);
    return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 && first !== 0x3fff
      && !(first === 0x2001 && (second <= 0x1ff || second === 0xdb8));
  }
  return false;
}
export interface WebhookResponse { status: number; body: string; retryAfter?: string }
export type WebhookPost = (url: string, headers: Record<string, string>, body: string) => Promise<WebhookResponse>;
/** Exact host allowlist must come from deployment config, never subscription input. */
export function createWebhookPost(allowedHosts: readonly string[]): WebhookPost {
  return async (raw, headers, body) => {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')
      || !allowedHosts.includes(url.hostname) || isIP(url.hostname)) throw new Error('CALLBACK_DESTINATION_DENIED');
    if (Buffer.byteLength(body) > 262144) throw new Error('PAYLOAD_TOO_LARGE');
    // Validate all answers and pin the actual connection to a validated address.
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(x => !publicAddress(x.address))) throw new Error('CALLBACK_DESTINATION_DENIED');
    const address = addresses[0];
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST', agent: false, servername: url.hostname, headers,
        lookup: (_host, _options, callback) => callback(null, address.address, address.family),
      }, res => {
        // Never follow redirects; cap responses too.
        const chunks: Buffer[] = []; let bytes = 0;
        res.on('data', chunk => { bytes += chunk.length; if (bytes > 16384) res.destroy(new Error('CALLBACK_RESPONSE_TOO_LARGE')); else chunks.push(chunk); });
        res.on('error', reject);
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), retryAfter: res.headers['retry-after'] }));
      });
      const timer = setTimeout(() => req.destroy(new Error('CALLBACK_TIMEOUT')), 10000);
      req.on('close', () => clearTimeout(timer)); req.on('error', reject); req.end(body);
    });
  };
}
export async function verifyCallback(post: WebhookPost, id: string, url: string, secret: string): Promise<void> {
  const challenge = token(), body = JSON.stringify({ type: 'verification', challenge });
  const started = Date.now();
  const response = await post(url, signedHeaders('verification_' + token(), id, body, [secret]), body);
  let echoed: unknown;
  try { echoed = JSON.parse(response.body).challenge; } catch { /* failed challenge */ }
  if (Date.now() - started > 10000 || response.status < 200 || response.status >= 300 || typeof echoed !== 'string' || !equal(echoed, challenge)) throw new Error('CALLBACK_CHALLENGE_FAILED');
}
