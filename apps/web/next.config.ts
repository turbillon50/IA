import type { NextConfig } from 'next';

// IAapp authenticates with its own account. Matrix/Flutter is no longer a
// production entry point and is not needed to use ChatGPT MCP tools.
const nextConfig: NextConfig = {
  transpilePackages: ['@iaapp/ui'],
  async redirects() {
    return [{ source: '/chat-client/:path*', destination: '/chats', permanent: false }];
  },
};
export default nextConfig;
