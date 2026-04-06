import type { ReactNode } from 'react';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-theme="light"
      className="flex min-h-screen flex-col bg-bg text-text"
    >
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
