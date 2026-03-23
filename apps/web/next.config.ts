import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@mymanager/config',
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
};

export default nextConfig;
