import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './ServiceUnavailable.module.css';

interface Props {
  title?: string;
  message?: ReactNode;
  /** Optional href for the action button (e.g. "/superadmin/settings/credentials"). */
  actionHref?: string;
  actionLabel?: string;
}

/**
 * Drop-in replacement for any feature that depends on an unconfigured/unreachable
 * third-party service. Renders a friendly explanation + a "How to Fix" link instead
 * of breaking the rest of the dashboard.
 *
 * Use inside a feature panel:
 *   {!cap.payments.configured && <ServiceUnavailable title="Billing temporarily unavailable" .../>}
 */
export function ServiceUnavailable({
  title = 'Service temporarily unavailable',
  message = 'This feature depends on a third-party service that is currently unreachable or not configured. The rest of the app is unaffected.',
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className={styles.panel} role="status">
      <div className={styles.iconWrap} aria-hidden="true">
        <svg className={styles.icon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{message}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref as any} className={styles.btn}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/** Compact pill version for inline use (e.g. inside a card header). */
export function ServiceUnavailableInline({
  message,
  actionHref,
  actionLabel = 'Reconnect',
}: {
  message: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className={styles.inline} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.inlineText}>{message}</span>
      {actionHref && (
        <Link href={actionHref as any} className={styles.inlineLink}>
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
