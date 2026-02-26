import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary/image-loader.ts',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://code.jquery.com https://widget.mondialrelay.com",
              "style-src 'self' 'unsafe-inline' https://widget.mondialrelay.com",
              "img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://picsum.photos https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://widget.mondialrelay.com https://*.mondialrelay.com",
              "font-src 'self' data: https://widget.mondialrelay.com",
              "connect-src 'self' https://*.sentry.io https://o*.ingest.sentry.io https://api.stripe.com https://*.mondialrelay.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://*.openstreetmap.org",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
