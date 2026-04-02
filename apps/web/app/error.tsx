 'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-heading text-4xl font-bold text-red-600">Something went wrong</h1>
      <p className="max-w-md text-gray-600">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="text-sm text-gray-400">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-brand bg-brand-primary px-6 py-3 text-white transition hover:bg-brand-primary-dark"
      >
        Try Again
      </button>
    </main>
  );
}
