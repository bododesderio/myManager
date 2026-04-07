'use client';

import { useEffect } from 'react';
import { ErrorPage, Illustrations } from '@/components/errors/ErrorPage';

interface RootErrorProps {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const variant = inferVariant(error);

  return (
    <ErrorPage
      code={variant.code}
      title={variant.title}
      subtitle={variant.subtitle}
      whatHappened={variant.whatHappened}
      illustration={variant.illustration}
      primaryAction={{ label: 'Try again', onClick: reset }}
      secondaryAction={{ label: 'Back to home', href: '/' }}
      digest={error.digest}
    />
  );
}

function inferVariant(error: Error & { status?: number }) {
  const msg = (error.message || '').toLowerCase();
  const status = error.status ?? statusFromMessage(msg);

  if (status === 400) {
    return {
      code: '400',
      title: 'Bad request',
      subtitle: 'Something about that request was malformed.',
      whatHappened:
        'The server understood the URL but rejected the data. Try again, and if it persists, double-check the values you submitted.',
      illustration: <Illustrations.Default />,
    };
  }
  if (status === 401) {
    return {
      code: '401',
      title: 'Sign in required',
      subtitle: 'You need to be signed in to view this page.',
      whatHappened:
        'Your session has expired or you have been signed out. Sign in again to continue where you left off.',
      illustration: <Illustrations.Lock />,
    };
  }
  if (status === 403) {
    return {
      code: '403',
      title: 'Access denied',
      subtitle: "You don't have permission to view this page.",
      whatHappened:
        "Your role doesn't grant access to this resource. If you think this is a mistake, contact your workspace owner.",
      illustration: <Illustrations.Lock />,
    };
  }
  return {
    code: '500',
    title: 'Something went wrong',
    subtitle: 'An unexpected error occurred while loading this page.',
    whatHappened:
      'Our team has been notified. Refreshing the page often resolves transient issues. If the problem persists, contact support.',
    illustration: <Illustrations.Server />,
  };
}

function statusFromMessage(msg: string): number {
  if (msg.includes('not found') || msg.includes('404')) return 404;
  if (msg.includes('unauthorized') || msg.includes('401')) return 401;
  if (msg.includes('forbidden') || msg.includes('access denied') || msg.includes('403')) return 403;
  if (msg.includes('bad request') || msg.includes('400')) return 400;
  return 500;
}
