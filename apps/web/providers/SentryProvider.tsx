'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Browser-side Sentry initialisation (docs/audit-2026-07-20.md §M12).
 *
 * Initialised explicitly from a client component rather than via
 * `sentry.client.config.ts`, because that file is only picked up by the
 * `withSentryConfig` webpack plugin — which this project deliberately does not
 * use yet (it would change the build pipeline and enable source-map upload).
 * Wiring it here captures browser errors today with no build changes.
 *
 * Uses NEXT_PUBLIC_SENTRY_DSN: the browser DSN is public by design (it is
 * write-only and carries no read access), but it must be a *separate* var from
 * the server-side SENTRY_DSN so no server-only value is ever inlined into the
 * client bundle.
 *
 * Fail-safe: with no DSN configured this is a no-op.
 */
export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    // getClient() is set once init has run — guards against double-init across
    // fast-refresh and remounts.
    if (Sentry.getClient()) return;

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      // Drop noise that is never actionable.
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
      ],
    });
  }, []);

  return <>{children}</>;
}
