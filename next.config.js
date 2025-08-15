/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for Netlify deployment
  trailingSlash: true,
  output: 'export',
  
  // App directory is enabled by default in Next.js 14
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
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
        {
          source: '/api/agents/:path*',
          destination: 'http://127.0.0.1:8000/api/agents/:path*',
        },
        {
          source: '/api/conversations/:path*',
          destination: 'http://127.0.0.1:8000/api/conversations/:path*',
        },
        {
          source: '/api/jobs/:path*',
          destination: 'http://127.0.0.1:8000/api/jobs/:path*',
        }
      ]
    }
    return []
  },
  // Add experimental features for better proxy handling
  experimental: {
    proxyTimeout: 30000,
  },
}

module.exports = nextConfig