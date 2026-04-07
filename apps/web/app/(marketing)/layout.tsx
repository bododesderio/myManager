import type { ReactNode } from 'react';
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

// Force dynamic rendering for the entire marketing tree so the navbar/footer
// always fetch fresh CMS data from the API. Otherwise Next.js builds these
// pages statically inside the docker build sandbox where the API isn't
// reachable, baking in empty fallbacks.
export const dynamic = 'force-dynamic';

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
