import Link from 'next/link';
import Image from 'next/image';
import { MobileNavMenu } from './MobileNavMenu';
import { MarketingNavLinks } from './MarketingNavLinks';
import { fetchServerApi } from '@/lib/api/server';

interface NavLink {
  label: string;
  href: string;
}

interface BrandConfig {
  app_name: string;
  logo_url: string | null;
  tagline: string;
}

const DEFAULT_BRAND: BrandConfig = { app_name: 'myManager', logo_url: null, tagline: '' };

async function getNavLinks(): Promise<NavLink[]> {
  const data = await fetchServerApi<{ main_nav?: NavLink[] }>(
    '/api/v1/cms/nav',
    {},
    { label: 'marketing nav links' },
  );
  // Always prepend Home so users have an obvious way back to the landing page.
  // Filter out any duplicate Home from the CMS payload.
  const cmsLinks = (data.main_nav ?? []).filter(
    (l) => l.href !== '/' && l.label.toLowerCase() !== 'home',
  );
  return [{ label: 'Home', href: '/' }, ...cmsLinks];
}

async function getBrand(): Promise<BrandConfig> {
  return fetchServerApi('/api/v1/cms/brand', DEFAULT_BRAND, { label: 'marketing brand config' });
}

export async function MarketingNavbar() {
  const [links, brand] = await Promise.all([getNavLinks(), getBrand()]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.svg" alt={brand.app_name} width={140} height={32} priority />
        </Link>

        {/* Center nav links — client island for active route highlight */}
        <MarketingNavLinks links={links} />

        {/* Right actions — hidden on mobile */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-[13px] font-semibold text-text transition-colors hover:text-primary"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-btn bg-primary px-4 py-2 text-[11px] font-bold text-white shadow-md transition hover:bg-[var(--color-primary-dark)] hover:shadow-lg"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger — client component island */}
        <MobileNavMenu links={links} />
      </div>
    </nav>
  );
}
