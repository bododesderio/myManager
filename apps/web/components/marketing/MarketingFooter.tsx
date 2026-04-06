import Link from 'next/link';
import type { Route } from 'next';
import { NewsletterForm } from './NewsletterForm';
import { fetchServerApi } from '@/lib/api/server';

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

async function getNavLinks(): Promise<{
  footer_product: NavLink[];
  footer_company: NavLink[];
}> {
  const data = await fetchServerApi<{ footer_product?: NavLink[]; footer_company?: NavLink[] }>(
    '/api/v1/cms/nav',
    {},
    { label: 'marketing footer nav links' },
  );
  return {
    footer_product: data.footer_product ?? [],
    footer_company: data.footer_company ?? [],
  };
}

async function getBrand(): Promise<BrandConfig> {
  return fetchServerApi('/api/v1/cms/brand', DEFAULT_BRAND, { label: 'marketing footer brand config' });
}

async function getFooterCms(): Promise<FooterCmsFields | null> {
  const page = await fetchServerApi<any>('/api/v1/cms/pages/landing', null, { label: 'marketing footer cms page' });
  const footerSection = page?.sections?.find(
    (s: any) => s.section_key === 'footer',
  );
  if (!footerSection) return null;
  const fields: Record<string, string> = {};
  for (const f of footerSection.fields || []) {
    fields[f.field_key] = f.value;
  }
  return fields;
}

export async function MarketingFooter() {
  const [nav, brand, footerCms] = await Promise.all([
    getNavLinks(),
    getBrand(),
    getFooterCms(),
  ]);

  return (
    <footer className="border-t border-border bg-[var(--color-bg-2)] pb-8 pt-12">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Brand tagline + Made in */}
          <div>
            <p className="font-heading text-[15px] font-bold text-[var(--color-primary-dark)]">
              {brand.app_name}
            </p>
            {footerCms?.tagline && (
              <p className="mt-2 whitespace-pre-line text-[12px] text-text-muted">
                {footerCms.tagline}
              </p>
            )}
            {brand.footer_made_in && (
              <p className="mt-4 text-[11px] text-text-muted">
                {brand.footer_made_in}
              </p>
            )}
          </div>

          {/* Col 2 — Product links */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold uppercase text-text-muted">
              Product
            </h4>
            <ul className="space-y-2">
              {nav.footer_product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as Route}
                    className="text-[13px] text-text-2 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Company links */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold uppercase text-text-muted">
              Company
            </h4>
            <ul className="space-y-2">
              {nav.footer_company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href as Route}
                    className="text-[13px] text-text-2 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Newsletter */}
          <div>
            <NewsletterForm
              title={footerCms?.newsletter_title}
              description={footerCms?.newsletter_desc}
              disclaimer={footerCms?.newsletter_disclaimer}
            />
          </div>
        </div>

        {/* Bottom row: Copyright only */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-center sm:justify-between">
            <p className="text-[11px] text-text-muted">
              {brand.footer_copyright || `© ${new Date().getFullYear()} ${brand.app_name}. All rights reserved.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
