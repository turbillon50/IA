/**
 * Reproducible IA.app CHAT shell for the production Next.js origin.
 * This is the real Flutter build, NOT an iframe or a redirect to another host.
 * Keep this release pin in sync with the QA record before promoting.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'apps', 'web', 'public', 'chat-client');
const SOURCE = 'https://github.com/turbillon50/iaapp-chat/releases/download/iaapp-web-f531a91/iaapp-chat-web-f531a91.tar.gz';
const EXPECTED_SHA256 = '5e189dc4186fc7797542ed095a00da9a2a8234aa0e663ce5049e768cfae132fb';

async function main() {
  const temp = await mkdtemp(join(tmpdir(), 'iaapp-chat-build-'));
  const archive = join(temp, 'chat.tar.gz');
  try {
    const local = process.env.IAAPP_CHAT_RELEASE_ARCHIVE;
    if (local) {
      const { copyFile } = await import('node:fs/promises');
      await copyFile(resolve(local), archive);
    } else {
      const response = await fetch(SOURCE, { headers: { 'User-Agent': 'IAapp-CI' } });
      if (!response.ok || !response.body) throw new Error('Unable to fetch pinned Flutter release: ' + response.status);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
    }
    const data = await readFile(archive);
    const digest = createHash('sha256').update(data).digest('hex');
    if (digest !== EXPECTED_SHA256) throw new Error('Flutter release SHA256 mismatch');
    await rm(DEST, { recursive: true, force: true });
    await mkdir(DEST, { recursive: true });
    execFileSync('tar', ['-xzf', archive, '-C', DEST, '--no-same-owner'], { stdio: 'pipe' });

    const indexPath = join(DEST, 'index.html');
    const index = await readFile(indexPath, 'utf8');
    if (!index.includes('<base href="/">') || !index.includes('IA.app CHAT')) throw new Error('Unexpected Flutter index');
    await writeFile(indexPath, index.replace('<base href="/">', '<base href="/chat-client/">'));
    for (const path of ['flutter_bootstrap.js', 'main.dart.js', 'Imaging.js', 'config.json', 'assets/assets/vodozemac/0.8.1/vodozemac_bindings_dart_bg.wasm']) {
      const bytes = await readFile(join(DEST, path));
      if (bytes.length === 0) throw new Error('Missing Flutter asset: ' + path);
    }
    await writeFile(join(DEST, 'release.json'), JSON.stringify({
      source: 'turbillon50/iaapp-chat', upstream: 'FluffyChat', revision: 'f531a9136c25882852e898fe3ac64679e0e6668c',
      archiveSHA256: EXPECTED_SHA256, productionPath: '/chat-client/'
    }, null, 2) + '\n');
    console.log('IA.app CHAT: pinned Flutter shell prepared and verified');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
main().catch(e => { console.error('IA.app CHAT release preparation failed:', e.message); process.exitCode = 1; });
