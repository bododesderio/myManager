'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Marketing route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-sm text-text-2">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      {error.digest && <p className="text-xs text-text-muted">Reference: {error.digest}</p>}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-btn border border-border px-5 py-2.5 text-sm font-medium text-text-2 hover:bg-bg-card"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
