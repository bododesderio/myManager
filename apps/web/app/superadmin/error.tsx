'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SuperadminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Superadmin route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Superadmin error</h1>
      <p className="max-w-md text-sm text-gray-600">
        {error.message || 'An unexpected error occurred in the admin portal.'}
      </p>
      {error.digest && <p className="text-xs text-gray-400">Reference: {error.digest}</p>}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/superadmin/dashboard"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
