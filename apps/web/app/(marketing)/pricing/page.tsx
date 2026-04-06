import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingToggle } from '@/components/marketing/PricingToggle';
import { fetchServerApi } from '@/lib/api/server';

async function getPlans() {
  return fetchServerApi('/api/v1/plans', [], { label: 'pricing page plans' });
}

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for teams of all sizes.',
};

const FAQ_ITEMS = [
  { q: 'Can I switch plans later?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.' },
  { q: 'Is there a free trial?', a: 'The Free plan is available forever with basic features. Paid plans include a 14-day free trial with full access.' },
  { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, MTN Mobile Money, Airtel Money, and bank transfers through Flutterwave.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel your subscription at any time. You will retain access until the end of your billing period.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes! Contact our sales team for special nonprofit and educational pricing.' },
  { q: 'What happens when I exceed my plan limits?', a: 'You will receive a notification when approaching limits. Existing scheduled posts will still publish, but you will need to upgrade to schedule more.' },
];

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <main className="min-h-screen bg-bg font-body text-text">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="pattern-dots absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-4 text-center">
          <p className="animate-fade-in-up text-[11px] font-bold uppercase tracking-wide text-primary">Pricing</p>
          <h1 className="animate-fade-in-up delay-100 mt-2 text-[42px] font-extrabold leading-tight lg:text-[46px]">
            Simple, Transparent Pricing
          </h1>
          <p className="animate-fade-in-up delay-200 mx-auto mt-4 max-w-xl text-[15px] text-text-2">
            Start free. Upgrade when you need more power. No hidden fees.
          </p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5">
          <PricingToggle plans={plans} />
        </div>
      </section>

      {/* ── ENTERPRISE CTA ── */}
      <section className="py-12">
        <div className="animate-fade-in-up mx-auto max-w-3xl px-5">
          <div className="gradient-border overflow-hidden rounded-card bg-gradient-to-br from-[var(--color-primary-light)] via-white to-[var(--color-secondary-light)] p-8 text-center shadow-[var(--shadow-card)]">
            <h3 className="text-[20px] font-bold text-text">Need a custom solution?</h3>
            <p className="mt-2 text-[14px] text-text-2">
              Enterprise plans with unlimited accounts, custom integrations, dedicated support, and SLA guarantees.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-block rounded-btn bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-dark)] px-6 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[var(--color-bg-2)] py-16">
        <div className="mx-auto max-w-3xl px-5">
          <div className="animate-fade-in-up text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">FAQ</p>
            <h2 className="mt-2 text-[28px] font-bold text-text">Frequently Asked Questions</h2>
          </div>
          <div className="mt-10 space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={item.q}
                className={`animate-fade-in-up card-hover rounded-card border border-border bg-white p-5 ${['', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'][i] || ''}`}
              >
                <h3 className="text-[14px] font-bold text-text">{item.q}</h3>
                <p className="mt-2 text-[13px] text-text-2">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16">
        <div className="animate-fade-in-up mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-[28px] font-bold text-text">Ready to get started?</h2>
          <p className="mt-3 text-[14px] text-text-2">Join thousands of creators and agencies managing their social media with myManager.</p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-btn bg-gradient-to-r from-primary to-[var(--color-primary-dark)] px-8 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </main>
  );
}
