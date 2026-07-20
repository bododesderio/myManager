'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@mymanager/ui';

export default function RouteError({
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
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-100 p-4">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-text">Couldn&apos;t load this page</h2>
      <p className="max-w-md text-sm text-text-2">
        {error.message || 'An error occurred while loading this section.'}
      </p>
      {error.digest && <p className="text-xs text-text-muted">Reference: {error.digest}</p>}
      <div className="flex gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/home"
          className="rounded-lg border border-border border-border px-6 py-2.5 text-sm font-medium text-text-2 hover:bg-bg-2"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
