'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-100 p-4">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-500">
        {error.message || 'An error occurred while loading this page. Please try again.'}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/home"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
