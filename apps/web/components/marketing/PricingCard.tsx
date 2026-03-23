import type { Route } from 'next';
import Link from 'next/link';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-brand border-2 p-8 ${
        highlighted
          ? 'border-brand-primary shadow-lg shadow-brand-primary/10'
          : 'border-gray-200'
      }`}
    >
      {highlighted && (
        <span className="mb-4 inline-block rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}
      <h3 className="font-heading text-2xl font-bold">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold">{price}</span>
        {period && <span className="text-gray-500">{period}</span>}
      </div>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-brand-primary">&#10003;</span>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref as Route}
        className={`mt-8 block rounded-brand px-6 py-3 text-center font-semibold transition ${
          highlighted
            ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
            : 'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
