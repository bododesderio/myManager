'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@mymanager/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry as well as the console — Phase 1 wired Sentry up,
    // but these boundaries were still only logging locally.
    Sentry.captureException(error);
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-error-light p-4">
        <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-text">Something went wrong</h2>
      <p className="max-w-md text-sm text-text-2">
        {error.message || 'An error occurred while loading this page. Please try again.'}
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        {/* Kept as an anchor: this is navigation, not an action, so it must
            remain right-clickable and middle-clickable. */}
        <a
          href="/home"
          className="inline-flex items-center justify-center rounded-btn border border-border border-border px-6 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
