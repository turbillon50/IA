import { selfHostedRuntimeOptions } from '../auth/runtime.ts';
import { createSelfHostedApplication } from './self-hosted.ts';

const runtime = selfHostedRuntimeOptions();
const { app } = createSelfHostedApplication(runtime.options);
// Migrations and account/client provisioning are explicit offline commands.
// This first milestone exposes only get_my_profile through the existing MCP transport.
const server = app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    server.close(() => { void runtime.close().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
