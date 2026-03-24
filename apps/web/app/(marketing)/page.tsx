import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { PricingToggle } from '@/components/marketing/PricingToggle';
import { PlatformIcon } from '@/components/icons/PlatformIcon';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getCmsPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/cms/pages/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch { return null; }
}

async function getPlans() {
  try {
    const res = await fetch(`${API_URL}/api/v1/plans`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? json;
  } catch { return []; }
}

async function getPlatforms() {
  try {
    const res = await fetch(`${API_URL}/api/v1/platforms`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? json;
  } catch { return []; }
}

function getFields(page: any, sectionKey: string): Record<string, string> {
  const section = page?.sections?.find((s: any) => s.section_key === sectionKey);
  if (!section) return {};
  const fields: Record<string, string> = {};
  for (const f of section.fields || []) fields[f.field_key] = f.value;
  return fields;
}

function safeParse(json: string | undefined, fallback: any[] = []) {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('landing');
  const hero = getFields(page, 'hero');
  return {
    title: hero.meta_title || 'myManager — Social Media Management Platform',
    description: hero.meta_description || 'Plan, schedule, and analyze your social media content across all platforms from one dashboard.',
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E4405F', tiktok: '#010101',
  linkedin: '#0A66C2', x: '#000000', twitter: '#000000',
  pinterest: '#E60023', youtube: '#FF0000', whatsapp: '#25D366',
  threads: '#000000', gbp: '#4285F4',
};

const MOCK_PILLS = [
  { label: 'Facebook', bg: '#1877F2' },
  { label: 'Instagram', bg: '#E4405F' },
  { label: 'TikTok', bg: '#010101' },
  { label: 'LinkedIn', bg: '#0A66C2' },
];

export default async function LandingPage() {
  const [page, plans, platforms] = await Promise.all([
    getCmsPage('landing'),
    getPlans(),
    getPlatforms(),
  ]);

  const hero = getFields(page, 'hero');
  const platformStrip = getFields(page, 'platform_strip');
  const features = getFields(page, 'features');
  const howItWorks = getFields(page, 'how_it_works');
  const statsBand = getFields(page, 'stats');
  const pricing = getFields(page, 'pricing_preview');
  const finalCta = getFields(page, 'final_cta');

  const trustItems: { text: string }[] = safeParse(hero.trust_items);
  const featureList: { icon: string; title: string; body: string }[] = safeParse(features.features_json);
  const steps: { number: string; title: string; body: string }[] = safeParse(howItWorks.steps_json);
  const stats: { value: string; label: string }[] = safeParse(statsBand.stats_json);

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[55%_45%]">
          {/* Left */}
          <div>
            {hero.announcement_badge_visible === 'true' && hero.announcement_badge_text && (
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-[11px] font-semibold text-primary-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {hero.announcement_badge_text}
              </span>
            )}
            <h1 className="text-[42px] font-extrabold leading-tight lg:text-[46px]">
              <span className="text-text">{hero.headline_line1 || 'Manage All Your'}</span>{' '}
              <span className="text-primary">{hero.headline_line2 || 'Social Media'}</span>
            </h1>
            <p className="mt-4 max-w-[480px] text-[15px] text-text-2">
              {hero.subtext || 'Schedule posts, track analytics, and grow your audience from one dashboard.'}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={(hero.cta_primary_href || '/signup') as Route}
                className="rounded-btn bg-primary px-6 py-3 text-[13px] font-bold text-white transition hover:bg-primary-dark"
              >
                {hero.cta_primary_text || 'Start Free Trial'}
              </Link>
              <Link
                href={(hero.cta_secondary_href || '/features') as Route}
                className="rounded-btn border border-primary px-6 py-3 text-[13px] font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                {hero.cta_secondary_text || 'See Features'}
              </Link>
            </div>
            {trustItems.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-4">
                {trustItems.map((item) => (
                  <span key={item.text} className="flex items-center gap-2 text-[12px] text-text-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right — Dashboard preview */}
          <div className="rounded-[16px] border border-border bg-white p-2 shadow-lg overflow-hidden">
            <Image
              src="/images/hero-dashboard.svg"
              alt="myManager Dashboard Preview"
              width={800}
              height={500}
              className="w-full h-auto rounded-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── PLATFORM STRIP ── */}
      <section className="bg-bg-2 py-8">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
            {platformStrip.label || 'Works with your favourite platforms'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {(platforms.length ? platforms : []).map((p: any) => (
              <span
                key={p.id || p.slug}
                className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-[12px] font-medium text-text"
              >
                <PlatformIcon platform={p.slug || p.name || ''} size={18} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
              {features.section_label || 'Features'}
            </p>
            <h2 className="mt-2 text-[28px] font-bold text-text">
              {features.headline || 'Everything you need to grow'}
            </h2>
            {features.subtext && (
              <p className="mx-auto mt-2 max-w-lg text-[13px] text-text-2">{features.subtext}</p>
            )}
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureList.map((feat) => (
              <div
                key={feat.title}
                className="rounded-card border border-border bg-white p-5 transition hover:border-primary"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-icon bg-primary-light">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-3 text-[13px] font-bold text-text">{feat.title}</h3>
                <p className="mt-1 text-[12px] text-text-2">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-bg-2 py-16">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            {howItWorks.section_label || 'How it works'}
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-text">
            {howItWorks.headline || 'Get started in minutes'}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[14px] font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-[14px] font-bold text-text">{step.title}</h3>
                <p className="mt-1 text-[12px] text-text-2">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="bg-stats-bg py-12 text-stats-text">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 text-center lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[34px] font-extrabold">{s.value}</p>
              <p className="text-[12px] opacity-65">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            {pricing.section_label || 'Pricing'}
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-text">
            {pricing.headline || 'Simple, transparent pricing'}
          </h2>
          {pricing.subtext && (
            <p className="mx-auto mt-2 max-w-lg text-[13px] text-text-2">{pricing.subtext}</p>
          )}
          <div className="mt-8">
            <PricingToggle plans={plans} />
          </div>
          {pricing.payment_methods_note && (
            <p className="mt-6 text-[11px] text-text-muted">{pricing.payment_methods_note}</p>
          )}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-primary-border bg-primary-light py-16">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-[28px] font-bold text-text">
            {finalCta.headline || 'Ready to grow your social presence?'}
          </h2>
          {finalCta.body && <p className="mt-3 text-[14px] text-text-2">{finalCta.body}</p>}
          <Link
            href={(finalCta.cta_href || '/signup') as Route}
            className="mt-6 inline-block rounded-btn bg-primary px-8 py-3 text-[13px] font-bold text-white transition hover:bg-primary-dark"
          >
            {finalCta.cta_text || 'Get Started Free'}
          </Link>
          {finalCta.note && (
            <p className="mt-3 text-[11px] text-text-muted">{finalCta.note}</p>
          )}
        </div>
      </section>
    </main>
  );
}
