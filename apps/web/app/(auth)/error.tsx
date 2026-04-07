'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-xl font-semibold">Sign-in unavailable</h1>
      <p className="max-w-sm text-sm text-text-2">
        {error.message || 'We could not load the sign-in page. Please try again.'}
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
