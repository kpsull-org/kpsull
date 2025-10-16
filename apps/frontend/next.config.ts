import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['better-auth'],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Skip static page generation for now due to Next.js 15 bug
  staticPageGenerationTimeout: 0,
}

export default nextConfig
