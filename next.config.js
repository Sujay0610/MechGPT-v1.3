/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 14
  async rewrites() {
    return [
      // Only proxy specific backend routes, let frontend handle upload routes
      {
        source: '/api/auth/:path*',
        destination: 'http://127.0.0.1:8000/api/auth/:path*',
      },
      {
        source: '/api/chat/:path*',
        destination: 'http://127.0.0.1:8000/api/chat/:path*',
      },
      {
        source: '/api/agents/:agentName/upload/status/:jobId',
        destination: 'http://127.0.0.1:8000/api/agents/:agentName/upload/status/:jobId',
      },
    ]
  },
  // Add experimental features for better proxy handling
  experimental: {
    proxyTimeout: 30000,
  },
}

module.exports = nextConfig