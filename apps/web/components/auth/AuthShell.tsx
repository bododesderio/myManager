import type { ReactNode } from 'react';
import Link from 'next/link';
import { fetchServerApi } from '@/lib/api/server';
import styles from './AuthShell.module.css';

interface BrandConfig {
  app_name?: string;
  app_tagline?: string;
}

interface StockImageResponse {
  hero_team?: string;
  hero_dashboard?: string;
}

interface Props {
  children: ReactNode;
  eyebrow?: string;
  headline?: string;
  subtext?: string;
}

const FALLBACK_BG = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=2000&q=80';

async function getBrand() {
  return fetchServerApi<BrandConfig | null>('/api/v1/brand', null, { label: 'auth brand' });
}

async function getStockImages() {
  return fetchServerApi<StockImageResponse>(
    '/api/v1/cms/stock-images',
    {},
    { label: 'auth stock images' },
  );
}

const BENEFITS = [
  'Plan & schedule posts across 10 platforms',
  'AI-assisted captions in your local language',
  'Approval workflows for compliance teams',
  'Pay with mobile money — MoMo, Airtel, cards',
];

export async function AuthShell({ children, eyebrow, headline, subtext }: Props) {
  const [brand, stock] = await Promise.all([getBrand(), getStockImages()]);
  const bg = stock.hero_team || stock.hero_dashboard || FALLBACK_BG;
  const appName = brand?.app_name ?? 'myManager';

  return (
    <div className={styles.wrap}>
      {/* Background layer */}
      <div
        className={styles.bg}
        style={{ ['--auth-bg' as any]: `url("${bg}")` } as React.CSSProperties}
        aria-hidden="true"
      />
      <div className={styles.bgOverlay} aria-hidden="true" />

      {/* Top brand bar */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          {appName}
        </Link>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>
      </header>

      <main className={styles.main}>
        {/* Left marketing column */}
        <section className={styles.copy}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {headline && <h1 className={styles.headline}>{headline}</h1>}
          {subtext && <p className={styles.subtext}>{subtext}</p>}
          <ul className={styles.benefits}>
            {BENEFITS.map((b) => (
              <li key={b} className={styles.benefit}>
                <span className={styles.checkDot} aria-hidden="true">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right glass card */}
        <section className={styles.card}>{children}</section>
      </main>
    </div>
  );
}
