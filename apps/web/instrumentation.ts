import * as Sentry from '@sentry/nextjs';

/**
 * Server- and edge-runtime Sentry initialisation (docs/audit-2026-07-20.md §M12).
 *
 * `@sentry/nextjs` was already a dependency but was never wired up, so every
 * server-side error on the user-facing app was invisible — only the API was
 * instrumented.
 *
 * Next.js loads this file natively, so no `withSentryConfig` wrapper (and no
 * build-pipeline change) is required. Adding that wrapper later would additionally
 * upload source maps for readable stack traces; this file does not depend on it.
 *
 * Fail-safe: if SENTRY_DSN is unset, Sentry is simply never initialised. It must
 * never be the reason the app fails to boot.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const common = {
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Match the API's sampling so traces line up across services.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(common);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(common);
  }
}

/**
 * Captures errors thrown in server components, route handlers and middleware.
 * Without this, App Router server errors never reach Sentry.
 */
export const onRequestError = Sentry.captureRequestError;
