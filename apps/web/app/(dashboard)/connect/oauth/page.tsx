'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/providers/ToastProvider';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const platform = searchParams.get('platform');

    if (!code || !state || !platform) {
      setStatus('error');
      setMessage('Missing OAuth parameters.');
      return;
    }

    async function complete() {
      try {
        const res = await fetch(`/api/v1/social-accounts/callback/${platform}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, workspaceId: searchParams.get('workspaceId') || '' }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'OAuth callback failed');
        }
        setStatus('success');
        setMessage('Account connected successfully!');
        addToast({ type: 'success', message: 'Social account connected!' });
        setTimeout(() => router.push('/settings/accounts'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to connect account.');
        addToast({ type: 'error', message: err.message || 'Failed to connect account.' });
      }
    }

    complete();
  }, [searchParams, router, addToast]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm rounded-brand border bg-white p-8 text-center shadow-sm">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
            <p className="text-sm text-gray-600">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">{message}</p>
            <p className="mt-2 text-xs text-gray-500">Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">{message}</p>
            <button
              onClick={() => router.push('/settings/accounts')}
              className="mt-4 rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Back to Accounts
            </button>
          </>
        )}
      </div>
    </div>
  );
}
