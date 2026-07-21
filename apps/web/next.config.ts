import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // isomorphic-dompurify loads jsdom on the server, and jsdom resolves internal
  // assets (default-stylesheet.css) relative to its own package directory.
  // Bundling it breaks that lookup and fails the build while collecting page
  // data for /blog/[slug]:
  //   ENOENT .next/server/app/browser/default-stylesheet.css
  // Keeping it external makes it a runtime require from node_modules, which is
  // how jsdom expects to be loaded. `output: 'standalone'` still traces it into
  // the deployed bundle.
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
  transpilePackages: [
    '@mymanager/config',
    '@mymanager/ui',
    '@mymanager/types',
    '@mymanager/utils',
    '@mymanager/constants',
    '@mymanager/validators',
    '@mymanager/seo',
    '@mymanager/translations',
    '@mymanager/emails',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
    ],
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "font-src 'self' data: https:",
      "connect-src 'self' http: https: ws: wss:",
      "media-src 'self' data: blob: https:",
      "worker-src 'self' blob:",
      // Force HTTPS in production (good for TLS deploys), but never in dev and
      // never when explicitly disabled. Without this guard the directive upgrades
      // every request to https://, and on an HTTP origin (localhost, a plain
      // preview) that breaks all navigation with ERR_SSL_PROTOCOL_ERROR.
      ...(process.env.NODE_ENV === 'production' && process.env.DISABLE_HTTPS_UPGRADE !== '1'
        ? ['upgrade-insecure-requests']
        : []),
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${apiUrl}/api/v1/:path*`,
        },
        {
          source: '/api/brand',
          destination: `${apiUrl}/api/brand`,
        },
        {
          source: '/api/docs/:path*',
          destination: `${apiUrl}/api/docs/:path*`,
        },
      ],
      fallback: [],
    };
  },
  experimental: {
    serverSourceMaps: true,
  },
};

export default nextConfig;
