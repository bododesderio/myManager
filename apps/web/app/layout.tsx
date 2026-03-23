import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/globals.css';
import { Providers } from '@/providers/Providers';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set data-theme before first paint */}
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
      </head>
      <body className="font-body antialiased text-text bg-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
