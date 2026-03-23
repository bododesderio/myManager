'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePlans } from '@/lib/hooks/useBilling';

export function PricingContent() {
  const { data, isLoading } = usePlans();
  const [annual, setAnnual] = useState(false);

  const plans = (data as any[]) || [];

  if (isLoading) {
    return (
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-brand border-2 border-gray-200 p-8">
            <div className="h-6 w-24 rounded bg-gray-200" />
            <div className="mt-4 h-10 w-20 rounded bg-gray-200" />
            <div className="mt-4 h-4 w-48 rounded bg-gray-200" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-3 w-40 rounded bg-gray-200" />
              ))}
            </div>
            <div className="mt-8 h-12 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  // Sort plans by price
  const sortedPlans = [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <>
      {/* Billing toggle */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            annual ? 'bg-brand-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              annual ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-500'}`}>
          Annual <span className="text-green-600 text-xs">(Save 20%)</span>
        </span>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {sortedPlans.filter((p) => !p.is_custom && p.is_active).map((plan) => {
          const price = annual ? plan.price_annual_usd : plan.price_monthly_usd;
          const isPopular = plan.slug === 'pro';
          const isCustom = plan.slug === 'enterprise' || plan.is_custom;
          const features = plan.features ? Object.entries(plan.features)
            .filter(([, v]) => v === true)
            .map(([k]) => k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
            : [];
          const limits = plan.limits || {};

          return (
            <div
              key={plan.id}
              className={`rounded-brand border-2 p-8 ${
                isPopular
                  ? 'border-brand-primary shadow-lg shadow-brand-primary/10'
                  : 'border-gray-200'
              }`}
            >
              {isPopular && (
                <span className="mb-4 inline-block rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h2 className="font-heading text-2xl font-bold">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                {isCustom ? (
                  <span className="text-4xl font-extrabold">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold">
                      ${price || 0}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{plan.description || ''}</p>

              <ul className="mt-6 space-y-3">
                {limits.connected_accounts && (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-brand-primary">&#10003;</span>
                    {limits.connected_accounts} connected accounts
                  </li>
                )}
                {limits.posts_per_month && (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-brand-primary">&#10003;</span>
                    {limits.posts_per_month} posts/month
                  </li>
                )}
                {limits.storage_gb && (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-brand-primary">&#10003;</span>
                    {limits.storage_gb} GB storage
                  </li>
                )}
                {limits.team_members > 1 && (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-brand-primary">&#10003;</span>
                    {limits.team_members} team members
                  </li>
                )}
                {features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-brand-primary">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={isCustom ? '/contact' : '/signup'}
                className={`mt-8 block rounded-brand px-6 py-3 text-center font-semibold transition ${
                  isPopular
                    ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                    : 'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white'
                }`}
              >
                {isCustom ? 'Contact Sales' : 'Start Free Trial'}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
