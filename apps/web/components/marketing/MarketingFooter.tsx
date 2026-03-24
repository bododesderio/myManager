import Link from 'next/link';
import type { Route } from 'next';
import { NewsletterForm } from './NewsletterForm';

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface NavLink {
  label: string;
  href: string;
}

interface BrandConfig {
  app_name: string;
  logo_url: string | null;
  tagline: string;
  footer_made_in?: string;
  footer_copyright?: string;
  supported_languages?: string[];
}

interface FooterCmsFields {
  tagline?: string;
  newsletter_title?: string;
  newsletter_desc?: string;
  newsletter_disclaimer?: string;
}

const DEFAULT_BRAND: BrandConfig = {
  app_name: 'MyManager',
  logo_url: null,
  tagline: '',
};

const DEFAULT_LANGUAGES = ['EN', 'FR', 'SW', 'AR', 'ES'];

async function getNavLinks(): Promise<{
  footer_product: NavLink[];
  footer_company: NavLink[];
}> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/nav`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { footer_product: [], footer_company: [] };
    const json = await res.json();
    const data = json?.data ?? json;
    return {
      footer_product: data.footer_product ?? [],
      footer_company: data.footer_company ?? [],
    };
  } catch {
    return { footer_product: [], footer_company: [] };
  }
}

async function getBrand(): Promise<BrandConfig> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/brand`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return DEFAULT_BRAND;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return DEFAULT_BRAND;
  }
}

async function getFooterCms(): Promise<FooterCmsFields | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/landing`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const page = json?.data ?? json;
    const footerSection = page.sections?.find(
      (s: any) => s.section_key === 'footer',
    );
    if (!footerSection) return null;
    const fields: Record<string, string> = {};
    for (const f of footerSection.fields || []) {
      fields[f.field_key] = f.value;
    }
    return fields;
  } catch {
    return null;
  }
}

export async function MarketingFooter() {
  const [nav, brand, footerCms] = await Promise.all([
    getNavLinks(),
    getBrand(),
    getFooterCms(),
  ]);

  const languages = brand.supported_languages ?? DEFAULT_LANGUAGES;

  return (
    <footer
      className="border-t pb-8 pt-12"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-bg-2)',
      }}
    >
      <div className="mx-auto max-w-[1200px] px-6">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Brand tagline + Made in */}
          <div>
            <p
              className="font-heading text-[15px] font-bold"
              style={{ color: 'var(--color-primary-dark)' }}
            >
              {brand.app_name}
            </p>
            {footerCms?.tagline && (
              <p
                className="mt-2 whitespace-pre-line text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {footerCms.tagline}
              </p>
            )}
            {brand.footer_made_in && (
              <p
                className="mt-4 text-[11px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {brand.footer_made_in}
              </p>
            )}
          </div>

          {/* Col 2 — Product links (footer_product placement) */}
          <div>
            <h4
              className="mb-3 text-[11px] font-bold uppercase"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Product
            </h4>
            <ul className="space-y-2">
              {nav.footer_product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as Route}
                    className="text-[13px] transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-text-2)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company links (footer_company placement) */}
          <div>
            <h4
              className="mb-3 text-[11px] font-bold uppercase"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Company
            </h4>
            <ul className="space-y-2">
              {nav.footer_company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as Route}
                    className="text-[13px] transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-text-2)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Newsletter (client island) */}
          <div>
            <NewsletterForm
              title={footerCms?.newsletter_title}
              description={footerCms?.newsletter_desc}
              disclaimer={footerCms?.newsletter_disclaimer}
            />
          </div>
        </div>

        {/* Bottom row: Language pills + Copyright */}
        <div
          className="mt-8 border-t pt-6"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Language pills */}
            <div className="flex flex-wrap gap-2">
              {languages.map((lang: string) => (
                <span
                  key={lang}
                  className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>

            {/* Copyright */}
            {brand.footer_copyright && (
              <p
                className="text-[11px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {brand.footer_copyright}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
