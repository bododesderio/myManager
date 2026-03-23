import type { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/ContactForm';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getBrandConfig() {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/brand`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getCmsPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function getFields(page: any, sectionKey: string): Record<string, string> {
  const section = page?.sections?.find((s: any) => s.section_key === sectionKey);
  if (!section) return {};
  const fields: Record<string, string> = {};
  for (const f of section.fields || []) fields[f.field_key] = f.value;
  return fields;
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('contact');
  const hero = getFields(page, 'contact_hero');
  return {
    title: hero.meta_title || 'Contact — myManager',
    description: hero.meta_description || 'Get in touch with the myManager team.',
  };
}

export default async function ContactPage() {
  const [page, brandPage] = await Promise.all([
    getCmsPage('contact'),
    getBrandConfig(),
  ]);

  const hero = getFields(page, 'contact_hero');
  const brand = getFields(brandPage, 'contact_info');

  const supportEmail = brand.support_email || 'support@mymanager.com';
  const salesEmail = brand.sales_email || 'sales@mymanager.com';

  // Collect social links from brand config
  const socialLinks: { label: string; url: string }[] = [];
  if (brand.twitter_url) socialLinks.push({ label: 'Twitter / X', url: brand.twitter_url });
  if (brand.linkedin_url) socialLinks.push({ label: 'LinkedIn', url: brand.linkedin_url });
  if (brand.instagram_url) socialLinks.push({ label: 'Instagram', url: brand.instagram_url });
  if (brand.facebook_url) socialLinks.push({ label: 'Facebook', url: brand.facebook_url });
  if (brand.youtube_url) socialLinks.push({ label: 'YouTube', url: brand.youtube_url });

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="mx-auto max-w-4xl px-5 pt-16 pb-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
          {hero.label || 'Contact'}
        </p>
        <h1 className="mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
          {hero.headline || 'Contact Us'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-2">
          {hero.subtext || 'Have a question or need help? Fill out the form below and we will get back to you within 24 hours.'}
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-5 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          {/* ── FORM ── */}
          <div>
            <ContactForm supportEmail={supportEmail} salesEmail={salesEmail} />
          </div>

          {/* ── SIDEBAR INFO ── */}
          <aside className="space-y-8 pt-10 lg:pt-0">
            {/* Email contacts */}
            <div className="rounded-card border border-border bg-white p-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Email Us</h3>
              <div className="mt-4 space-y-3 text-[13px]">
                <div>
                  <p className="text-text-muted">Support</p>
                  <a href={`mailto:${supportEmail}`} className="font-medium text-primary hover:underline">
                    {supportEmail}
                  </a>
                </div>
                <div>
                  <p className="text-text-muted">Sales</p>
                  <a href={`mailto:${salesEmail}`} className="font-medium text-primary hover:underline">
                    {salesEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="rounded-card border border-border bg-white p-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Follow Us</h3>
                <div className="mt-4 space-y-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[13px] font-medium text-primary hover:underline"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Office / Extra info */}
            {brand.address && (
              <div className="rounded-card border border-border bg-white p-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-text">Office</h3>
                <p className="mt-3 text-[13px] text-text-2 whitespace-pre-line">{brand.address}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
