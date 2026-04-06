'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly_usd: string | number;
  price_annual_usd: string | number;
  description: string;
  features: Record<string, boolean | number>;
  limits: Record<string, number>;
  is_custom?: boolean;
  sort_order?: number;
}

const FEATURE_LABELS: Record<string, string> = {
  scheduling: 'Smart scheduling',
  previews: 'Live platform previews',
  ai: 'AI-powered captions & hashtags',
  reports: 'Custom reports',
  best_time: 'Best time to post',
  recurring: 'Recurring posts',
  competitor: 'Competitor tracking',
  approval_workflow: 'Approval workflows',
  client_portal: 'Client portal',
  api: 'REST API access',
  white_label: 'White-label branding',
};

const TIER_ACCENTS: Record<string, string> = {
  free: 'from-[#38BDF8] to-[#0EA5E9]',
  starter: 'from-[#1D9E75] to-[#059669]',
  pro: 'from-[#7F77DD] to-[#534AB7]',
  enterprise: 'from-[#FF6B6B] to-[#E84545]',
};

function planFeatureLines(plan: Plan): string[] {
  const lines: string[] = [];
  const lim = plan.limits || {};
  if (lim.posts != null) lines.push(lim.posts === -1 ? 'Unlimited posts' : `${lim.posts} posts/month`);
  if (lim.accounts != null) lines.push(lim.accounts === -1 ? 'Unlimited accounts' : `${lim.accounts} social accounts`);
  if (lim.seats != null && lim.seats > 1) lines.push(`${lim.seats} team seats`);
  if (lim.storage_gb != null) lines.push(lim.storage_gb === -1 ? 'Unlimited storage' : `${lim.storage_gb} GB storage`);
  if (lim.ai_credits) lines.push(lim.ai_credits === -1 ? 'Unlimited AI credits' : `${lim.ai_credits} AI credits/month`);

  const feat = plan.features || {};
  for (const [key, label] of Object.entries(FEATURE_LABELS)) {
    if (feat[key] === true) lines.push(label);
  }
  const days = feat.analytics_days;
  if (typeof days === 'number' && days > 0) lines.push(`${days}-day analytics history`);

  return lines;
}

export function PricingToggle({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false);

  const displayPlans = (plans || [])
    .filter((p) => !p.is_custom)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <>
      {/* Toggle */}
      <div className="mx-auto mb-10 flex items-center justify-center gap-3">
        <span className={`text-[13px] font-medium transition-colors ${!annual ? 'text-text' : 'text-text-muted'}`}>
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          className={`relative h-7 w-12 rounded-full transition-all duration-300 ${annual ? 'bg-primary shadow-[0_0_12px_rgba(127,119,221,0.4)]' : 'bg-border'}`}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${annual ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
        <span className={`text-[13px] font-medium transition-colors ${annual ? 'text-text' : 'text-text-muted'}`}>
          Annual
        </span>
        {annual && (
          <span className="animate-scale-in rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-[10px] font-bold text-white">
            Save 20%
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {displayPlans.map((plan, index) => {
          const priceNum = Number(annual ? plan.price_annual_usd : plan.price_monthly_usd) || 0;
          const period = priceNum === 0 ? '' : annual ? '/yr' : '/mo';
          const highlighted = plan.slug === 'pro';
          const featureLines = planFeatureLines(plan);
          const gradient = TIER_ACCENTS[plan.slug] || TIER_ACCENTS.starter;

          return (
            <div
              key={plan.id}
              className={`animate-fade-in-up relative overflow-hidden rounded-card border-2 bg-white p-6 transition-all duration-300 hover:-translate-y-1 ${
                highlighted
                  ? 'border-primary shadow-[0_8px_30px_rgba(127,119,221,0.15)] scale-[1.02]'
                  : 'border-border hover:border-primary hover:shadow-[var(--shadow-card-hover)]'
              } ${['', 'delay-100', 'delay-200', 'delay-300'][index] || ''}`}
            >
              {/* Top gradient accent bar */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />

              {highlighted && (
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 translate-y-2 rounded-full bg-gradient-to-r from-primary to-[var(--color-primary-dark)] px-3 py-1 text-[10px] font-bold text-white shadow-md">
                  Most popular
                </span>
              )}

              <h3 className="mt-3 text-[15px] font-bold text-text">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[32px] font-extrabold text-text">
                  {priceNum === 0 ? 'Free' : `$${priceNum}`}
                </span>
                {period && <span className="text-[13px] text-text-muted">{period}</span>}
              </div>
              <p className="mt-2 text-[12px] text-text-2">{plan.description}</p>
              <ul className="mt-5 space-y-2.5">
                {featureLines.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12px] text-text-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={'/signup' as Route}
                className={`mt-6 block rounded-btn py-2.5 text-center text-[12px] font-bold transition-all duration-300 ${
                  highlighted
                    ? 'bg-gradient-to-r from-primary to-[var(--color-primary-dark)] text-white shadow-md hover:shadow-lg hover:brightness-110'
                    : 'border border-primary text-primary hover:bg-primary hover:text-white hover:shadow-md'
                }`}
              >
                {priceNum === 0 ? 'Start Free' : 'Get Started'}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
