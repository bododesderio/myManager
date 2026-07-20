'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Error boundary for the client portal (docs/audit-2026-07-20.md §5.2).
 *
 * The portal was one of only two route trees with no boundary, so a render error
 * here fell through to the root boundary and showed an app-shell error page to
 * an external client who has never seen the app.
 *
 * Deliberately does NOT surface `error.message`. The portal is reached by a
 * shared token and viewed by people outside the workspace — an internal
 * exception string is both meaningless and a potential information leak. The
 * digest is shown instead so support can correlate it with the Sentry event.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: 'client-portal' } });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary-light p-4">
        <svg
          className="h-8 w-8 text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-text">This page could not be loaded</h1>
      <p className="max-w-md text-sm text-text-2">
        Something went wrong while loading this shared view. Refreshing usually
        resolves it. If it keeps happening, contact whoever shared this link with
        you.
      </p>

      {error.digest && (
        <p className="text-xs text-text-muted">Reference: {error.digest}</p>
      )}

      <button
        type="button"
        onClick={reset}
        className="rounded-btn bg-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Try again
      </button>
    </div>
  );
}
