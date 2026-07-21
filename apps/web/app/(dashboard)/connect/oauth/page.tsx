'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/providers/ToastProvider';
import { Card } from '@mymanager/ui';
import { apiClient } from '@/lib/api/client';

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
        await apiClient.post(`/social-accounts/callback/${platform}`, {
          code,
          state,
          workspaceId: searchParams.get('workspaceId') || '',
        });
        setStatus('success');
        setMessage('Account connected successfully!');
        addToast({ type: 'success', message: 'Social account connected!' });
        setTimeout(() => router.push('/settings/accounts'), 2000);
      } catch (err: any) {
        setStatus('error');
        const msg = err?.message || err?.error?.message || 'Failed to connect account.';
        setMessage(msg);
        addToast({ type: 'error', message: msg });
      }
    }

    complete();
  }, [searchParams, router, addToast]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card padding="none" className="max-w-sm p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-text-2">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-text">{message}</p>
            <p className="mt-2 text-xs text-text-2">Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-text">{message}</p>
            <button
              onClick={() => router.push('/settings/accounts')}
              className="mt-4 rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Back to Accounts
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
