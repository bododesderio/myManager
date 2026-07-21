'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('Internal route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-text">Internal render error</h1>
      <p className="max-w-md text-sm text-text-2">
        {error.message || 'An error occurred while rendering this internal page.'}
      </p>
      {error.digest && <p className="text-xs text-text-muted">Reference: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
