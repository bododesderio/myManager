'use client';

import { ErrorPage, Illustrations } from '@/components/errors/ErrorPage';

/**
 * Last-resort error boundary that catches errors in the root layout itself
 * (Next.js requires a complete <html><body> structure here).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorPage
          code="500"
          title="Application crashed"
          subtitle="Something went badly wrong while loading the page."
          whatHappened="The root layout failed to render. This is rare and usually means a deploy is in progress or a critical asset is unavailable. Refreshing the page often resolves it."
          illustration={<Illustrations.Server />}
          primaryAction={{ label: 'Reload page', onClick: reset }}
          secondaryAction={{ label: 'Visit homepage', href: '/' }}
          digest={error.digest}
        />
      </body>
    </html>
  );
}
