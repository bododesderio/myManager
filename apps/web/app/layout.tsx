import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/globals.css';
import { Providers } from '@/providers/Providers';
import { BrandStyleInjector } from '@/providers/BrandProvider';

export const metadata: Metadata = {
  title: {
    default: 'myManager - Social Media Management Platform',
    template: '%s | myManager',
  },
  description:
    'Plan, schedule, and analyze your social media content across all platforms from one dashboard.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: honour stored override, otherwise let OS preference flow through @media in globals.css */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('mymanager-theme');
                if (stored === 'dark' || stored === 'light') {
                  document.documentElement.setAttribute('data-theme', stored);
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Server-rendered brand colors override globals.css defaults at request time */}
        <BrandStyleInjector />
      </head>
      <body className="font-body antialiased text-text bg-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
