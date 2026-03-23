'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number;
  description: string;
  features: string[];
  is_popular?: boolean;
  cta_text?: string;
  cta_href?: string;
}

export function PricingToggle({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* Toggle */}
      <div className="mx-auto mb-10 flex items-center justify-center gap-3">
        <span className={`text-[13px] font-medium ${!annual ? 'text-text' : 'text-text-muted'}`}>
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          className={`relative h-7 w-12 rounded-full transition-colors ${annual ? 'bg-primary' : 'bg-border'}`}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
        <span className={`text-[13px] font-medium ${annual ? 'text-text' : 'text-text-muted'}`}>
          Annual
        </span>
        {annual && (
          <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold text-accent">
            Save 20%
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = annual ? plan.price_annual : plan.price_monthly;
          const period = price === 0 ? '' : annual ? '/yr' : '/mo';
          const highlighted = plan.is_popular || plan.slug === 'pro';

          return (
            <div
              key={plan.id}
              className={`relative rounded-card border-2 p-6 ${
                highlighted
                  ? 'border-primary shadow-lg shadow-primary/10'
                  : 'border-border'
              } bg-white`}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-[15px] font-bold text-text">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[32px] font-extrabold text-text">
                  {price === 0 ? 'Free' : `$${price}`}
                </span>
                {period && <span className="text-[13px] text-text-muted">{period}</span>}
              </div>
              <p className="mt-2 text-[12px] text-text-2">{plan.description}</p>
              <ul className="mt-5 space-y-2">
                {(plan.features || []).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12px] text-text-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={(plan.cta_href || '/signup') as Route}
                className={`mt-6 block rounded-btn py-2.5 text-center text-[12px] font-bold transition ${
                  highlighted
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'border border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {plan.cta_text || 'Get Started'}
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
