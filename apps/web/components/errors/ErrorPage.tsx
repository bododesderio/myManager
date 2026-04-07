import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './ErrorPage.module.css';

interface Props {
  code: string;
  title: string;
  subtitle: string;
  whatHappened: ReactNode;
  primaryAction: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  digest?: string;
  illustration?: ReactNode;
}

/**
 * Branded error page used across the entire system. The illustration is an
 * inline SVG so it always renders, never depends on a 3rd party CDN, and
 * inherits the current brand colors via currentColor / CSS vars.
 */
export function ErrorPage({
  code,
  title,
  subtitle,
  whatHappened,
  primaryAction,
  secondaryAction,
  digest,
  illustration,
}: Props) {
  const renderAction = (action: NonNullable<Props['primaryAction']>, primary = true) => {
    const className = primary ? styles.btnPrimary : styles.btnSecondary;
    if (action.href) {
      return (
        <Link href={action.href as any} className={className}>
          {action.label}
        </Link>
      );
    }
    return (
      <button type="button" className={className} onClick={action.onClick}>
        {action.label}
      </button>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card} role="alert">
        <span className={styles.codeRow}>Error · {code}</span>
        <div className={styles.illustration}>{illustration ?? <DefaultIllustration />}</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.tipBox}>
          <span className={styles.tipLabel}>What happened</span>
          <p className={styles.tipText}>{whatHappened}</p>
        </div>
        <div className={styles.actions}>
          {renderAction(primaryAction, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
        {digest && <p className={styles.digest}>Reference: {digest}</p>}
      </div>
    </div>
  );
}

function DefaultIllustration() {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary, #6d5ae8)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-secondary, #ff5c7a)" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="200" height="120" rx="14" fill="url(#g1)" />
      <circle cx="60" cy="80" r="22" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" />
      <path d="M48 80h24M60 68v24" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" strokeLinecap="round" />
      <rect x="100" y="60" width="100" height="10" rx="5" fill="var(--color-primary, #6d5ae8)" fillOpacity="0.5" />
      <rect x="100" y="80" width="80" height="8" rx="4" fill="var(--color-primary, #6d5ae8)" fillOpacity="0.3" />
      <rect x="100" y="98" width="60" height="8" rx="4" fill="var(--color-primary, #6d5ae8)" fillOpacity="0.2" />
    </svg>
  );
}

function NotFoundIllustration() {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text x="50%" y="65%" textAnchor="middle" fontSize="86" fontWeight="900" fill="var(--color-primary, #6d5ae8)" fillOpacity="0.18">
        404
      </text>
      <circle cx="110" cy="80" r="30" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" />
      <path d="M132 102l16 16" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LockIllustration() {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="70" y="60" width="80" height="68" rx="10" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" />
      <path d="M82 60V46a28 28 0 1156 0v14" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" />
      <circle cx="110" cy="92" r="6" fill="var(--color-primary, #6d5ae8)" />
      <line x1="110" y1="98" x2="110" y2="112" stroke="var(--color-primary, #6d5ae8)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function ServerIllustration() {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="46" y="34" width="128" height="32" rx="6" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" />
      <rect x="46" y="74" width="128" height="32" rx="6" stroke="var(--color-primary, #6d5ae8)" strokeWidth="3" />
      <circle cx="62" cy="50" r="3" fill="var(--color-secondary, #ff5c7a)" />
      <circle cx="62" cy="90" r="3" fill="var(--color-secondary, #ff5c7a)" />
      <line x1="80" y1="50" x2="160" y2="50" stroke="var(--color-primary, #6d5ae8)" strokeOpacity="0.4" strokeWidth="3" />
      <line x1="80" y1="90" x2="140" y2="90" stroke="var(--color-primary, #6d5ae8)" strokeOpacity="0.4" strokeWidth="3" />
      <path d="M90 124l40-40M130 124l-40-40" stroke="var(--color-secondary, #ff5c7a)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export const Illustrations = {
  Default: DefaultIllustration,
  NotFound: NotFoundIllustration,
  Lock: LockIllustration,
  Server: ServerIllustration,
};
