import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { PricingToggle } from '@/components/marketing/PricingToggle';
import { PlatformIcon } from '@/components/icons/PlatformIcon';
import { fetchServerApi } from '@/lib/api/server';

async function getCmsPage(slug: string) {
  return fetchServerApi(`/api/v1/cms/pages/${slug}`, null, { label: `cms page:${slug}` });
}

async function getPlans() {
  return fetchServerApi('/api/v1/plans', [], { label: 'public plans' });
}

async function getPlatforms() {
  return fetchServerApi('/api/v1/platforms', [], { label: 'public platforms' });
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

const FEATURE_ICONS = [
  'M13 10V3L4 14h7v7l9-11h-7z',
  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
];

const FEATURE_COLORS = [
  { bg: 'bg-[var(--color-primary-light)]', text: 'text-primary' },
  { bg: 'bg-[var(--color-secondary-light)]', text: 'text-[var(--color-secondary)]' },
  { bg: 'bg-[var(--color-tertiary-light)]', text: 'text-[var(--color-tertiary)]' },
  { bg: 'bg-[var(--color-accent-light)]', text: 'text-[var(--color-accent)]' },
  { bg: 'bg-[var(--color-primary-light)]', text: 'text-primary' },
  { bg: 'bg-[var(--color-secondary-light)]', text: 'text-[var(--color-secondary)]' },
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
      <section className="relative overflow-hidden bg-mesh">
        <div className="pattern-dots absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[55%_45%]">
            {/* Left */}
            <div className="animate-fade-in-up">
              {hero.announcement_badge_visible === 'true' && hero.announcement_badge_text && (
                <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-[11px] font-semibold text-[var(--color-primary-dark)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                  {hero.announcement_badge_text}
                </span>
              )}
              <h1 className="text-[42px] font-extrabold leading-tight lg:text-[46px]">
                <span className="text-text">{hero.headline_line1 || 'Manage All Your'}</span>{' '}
                <span className="text-gradient">{hero.headline_line2 || 'Social Media'}</span>
              </h1>
              <p className="mt-4 max-w-[480px] text-[15px] text-text-2">
                {hero.subtext || 'Schedule posts, track analytics, and grow your audience from one dashboard.'}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={(hero.cta_primary_href || '/signup') as Route}
                  className="rounded-btn bg-gradient-to-r from-primary to-[var(--color-primary-dark)] px-6 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
                >
                  {hero.cta_primary_text || 'Start Free Trial'}
                </Link>
                <Link
                  href={(hero.cta_secondary_href || '/features') as Route}
                  className="rounded-btn border border-primary px-6 py-3 text-[13px] font-bold text-primary transition-all hover:bg-primary hover:text-white hover:shadow-md"
                >
                  {hero.cta_secondary_text || 'See Features'}
                </Link>
              </div>
              {trustItems.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-4">
                  {trustItems.map((item, i) => (
                    <span key={item.text} className={`animate-fade-in-up delay-${(i + 1) * 100} flex items-center gap-2 text-[12px] text-text-2`}>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]">
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
            <div className="animate-fade-in-up delay-300 animate-float rounded-[16px] border border-border bg-white p-2 shadow-[var(--shadow-float)] overflow-hidden">
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
        </div>
      </section>

      {/* ── PLATFORM STRIP ── */}
      <section className="bg-[var(--color-bg-2)] py-8">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
            {platformStrip.label || 'Works with your favourite platforms'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {(platforms.length ? platforms : []).map((p: any, i: number) => (
              <span
                key={p.id || p.slug}
                className={`animate-fade-in-up card-hover flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-[12px] font-medium text-text ${['', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600', 'delay-700'][i] || 'delay-700'}`}
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
          <div className="animate-fade-in-up text-center">
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
            {featureList.map((feat, i) => {
              const color = FEATURE_COLORS[i % FEATURE_COLORS.length];
              return (
                <div
                  key={feat.title}
                  className={`animate-fade-in-up card-hover rounded-card border border-border bg-white p-5 ${['', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'][i] || 'delay-500'}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-icon ${color.bg}`}>
                    <svg className={`h-5 w-5 ${color.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={FEATURE_ICONS[i % FEATURE_ICONS.length]} />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-[13px] font-bold text-text">{feat.title}</h3>
                  <p className="mt-1 text-[12px] text-text-2">{feat.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[var(--color-bg-2)] py-16">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="animate-fade-in-up text-[11px] font-bold uppercase tracking-wide text-primary">
            {howItWorks.section_label || 'How it works'}
          </p>
          <h2 className="animate-fade-in-up mt-2 text-[28px] font-bold text-text">
            {howItWorks.headline || 'Get started in minutes'}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className={`animate-fade-in-up flex flex-col items-center ${['', 'delay-200', 'delay-400'][i] || ''}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--color-primary-dark)] text-[14px] font-bold text-white shadow-md">
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
      <section className="animate-gradient bg-gradient-to-r from-[var(--color-stats-bg)] via-primary to-[var(--color-tertiary-dark)] py-12 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 text-center lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`animate-fade-in-up ${['', 'delay-100', 'delay-200', 'delay-300'][i] || ''}`}>
              <p className="text-[34px] font-extrabold">{s.value}</p>
              <p className="text-[12px] opacity-75">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="animate-fade-in-up text-[11px] font-bold uppercase tracking-wide text-primary">
            {pricing.section_label || 'Pricing'}
          </p>
          <h2 className="animate-fade-in-up mt-2 text-[28px] font-bold text-text">
            {pricing.headline || 'Simple, transparent pricing'}
          </h2>
          {pricing.subtext && (
            <p className="animate-fade-in-up mx-auto mt-2 max-w-lg text-[13px] text-text-2">{pricing.subtext}</p>
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-light)] via-white to-[var(--color-secondary-light)] py-16">
        <div className="pattern-grid absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-2xl px-5 text-center">
          <h2 className="animate-fade-in-up text-[28px] font-bold text-text">
            {finalCta.headline || 'Ready to grow your social presence?'}
          </h2>
          {finalCta.body && <p className="animate-fade-in-up delay-100 mt-3 text-[14px] text-text-2">{finalCta.body}</p>}
          <Link
            href={(finalCta.cta_href || '/signup') as Route}
            className="animate-fade-in-up delay-200 mt-6 inline-block rounded-btn bg-gradient-to-r from-primary to-[var(--color-primary-dark)] px-8 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
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
