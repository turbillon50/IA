import { createRestApp, type RestOptions } from './rest/index.ts';
import { createMcpHandler, type McpConfig } from './mcp/server.ts';

/** Composition boundary. Production must inject verified persistence and OAuth;
 * without that complete configuration MCP is explicitly unavailable. */
export function createApplication(options: { rest: RestOptions; mcp?: McpConfig }) {
  const app = createRestApp(options.rest);
  const mcp = options.mcp ? createMcpHandler(options.mcp) : null;
  const resourcePath = options.mcp ? new URL(options.mcp.oauth.resource).pathname : '/mcp';
  const metadataPath = options.mcp ? new URL(options.mcp.metadataUrl).pathname : '/.well-known/oauth-protected-resource';
  if (resourcePath.startsWith('/api/v1') || metadataPath.startsWith('/api/v1') ||
      resourcePath === metadataPath || [resourcePath, metadataPath].includes('/healthz')) {
    throw new Error('MCP_ROUTE_COLLISION');
  }
  app.get('/healthz', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok', service: 'iaapp-api', mcp: mcp ? 'configured' : 'disabled' });
  });
  // REST's JSON parser is scoped to /api/v1. MCP must receive the original stream.
  app.use((req, res, next) => {
    const path = new URL(req.url, 'http://local.invalid').pathname;
    if (path !== resourcePath && path !== metadataPath) return next();
    if (!mcp) {
      res.set('Cache-Control', 'no-store').status(503).json({ error: 'MCP_NOT_CONFIGURED' });
      return;
    }
    void mcp(req, res).catch(() => {
      if (res.headersSent) res.destroy();
      else res.status(503).json({ error: 'MCP_UNAVAILABLE' });
    });
  });
  return app;
}
