import type { NextConfig } from 'next';

// Single production origin: Flutter owns the main chat; Next keeps identity,
// account management, OAuth, MCP and the existing backend routes intact.
const nextConfig: NextConfig = {
  transpilePackages: ['@iaapp/ui'],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/chat-client/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};
export default nextConfig;
