import type { Route } from 'next';
import Link from 'next/link';

interface HeroSectionProps {
  heading: string;
  highlightedText?: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function HeroSection({
  heading,
  highlightedText,
  subheading,
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <h1 className="font-heading text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
        {heading}{' '}
        {highlightedText && (
          <span className="text-brand-primary">{highlightedText}</span>
        )}
      </h1>
      <p className="max-w-2xl text-lg text-gray-600 md:text-xl">{subheading}</p>
      <div className="flex gap-4">
        <Link
          href={primaryCta.href as Route}
          className="rounded-brand bg-brand-primary px-8 py-3 text-lg font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          {primaryCta.label}
        </Link>
        {secondaryCta && (
          <Link
            href={secondaryCta.href as Route}
            className="rounded-brand border border-gray-300 px-8 py-3 text-lg font-semibold transition hover:border-brand-primary hover:text-brand-primary"
          >
            {secondaryCta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
