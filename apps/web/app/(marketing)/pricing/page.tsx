import type { Metadata } from 'next';
import { PricingContent } from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for teams of all sizes.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start free. Upgrade when you need more power.
          </p>
        </div>
        <PricingContent />
      </div>
    </main>
  );
}
