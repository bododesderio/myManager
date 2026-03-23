import Link from 'next/link';
import type { Route } from 'next';
import { MobileNavMenu } from './MobileNavMenu';

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface NavLink {
  label: string;
  href: string;
}

interface BrandConfig {
  app_name: string;
  logo_url: string | null;
  tagline: string;
}

const DEFAULT_BRAND: BrandConfig = { app_name: 'MyManager', logo_url: null, tagline: '' };

async function getNavLinks(): Promise<NavLink[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/nav`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.main_nav ?? [];
  } catch {
    return [];
  }
}

async function getBrand(): Promise<BrandConfig> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/brand`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return DEFAULT_BRAND;
    return await res.json();
  } catch {
    return DEFAULT_BRAND;
  }
}

export async function MarketingNavbar() {
  const [links, brand] = await Promise.all([getNavLinks(), getBrand()]);

  return (
    <nav
      className="sticky top-0 z-50 border-b bg-[var(--color-bg)]"
      style={{
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="font-heading text-[15px] font-bold"
          style={{ color: 'var(--color-primary-dark)' }}
        >
          {brand.app_name}
        </Link>

        {/* Center nav links — hidden on mobile */}
        <ul className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href as Route}
                className="text-[13px] font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--color-text-2)' }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions — hidden on mobile */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-[13px] transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-2)' }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-btn px-4 py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
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
