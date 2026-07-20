'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Error boundary for the /user route tree (docs/audit-2026-07-20.md §5.2).
 * Previously uncovered, so failures here fell through to the root boundary.
 */
export default function UserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { surface: 'user' } });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-text">Something went wrong</h1>
      <p className="max-w-md text-sm text-text-2">
        {error.message || 'An error occurred while loading this page. Please try again.'}
      </p>

      {error.digest && (
        <p className="text-xs text-text-muted">Error ID: {error.digest}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-btn bg-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Try again
        </button>
        <a
          href="/home"
          className="rounded-btn border border-border px-6 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
