'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useVerifyEmail } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/providers/ToastProvider';

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const verifyEmail = useVerifyEmail();
  const { addToast } = useToast();
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token && status === 'pending') {
      setStatus('verifying');
      verifyEmail.mutate(
        { token },
        {
          onSuccess: () => setStatus('success'),
          onError: () => setStatus('error'),
        },
      );
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResend() {
    if (!email) {
      addToast({ type: 'error', message: 'No email address found. Please sign up again.' });
      return;
    }
    setResending(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      addToast({ type: 'success', message: 'Verification email resent. Check your inbox.' });
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Failed to resend verification email.';
      addToast({ type: 'error', message: msg });
    } finally {
      setResending(false);
    }
  }

  // Token present — auto-verify
  if (token) {
    if (status === 'verifying') {
      return (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--brand-primary)]" />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 font-heading text-3xl font-extrabold">Email Verified</h1>
          <p className="mt-4 text-gray-600">Your email has been verified. You can now log in.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-btn bg-primary px-6 py-3 text-[13px] font-bold text-white"
          >
            Log In
          </Link>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-6 font-heading text-3xl font-extrabold">Verification Failed</h1>
          <p className="mt-4 text-gray-600">
            This link may have expired or already been used.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-brand-primary hover:underline"
          >
            Back to Log In
          </Link>
        </div>
      );
    }
  }

  // No token — show "check your email" message
  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
        <span className="text-3xl text-brand-primary">&#9993;</span>
      </div>
      <h1 className="mt-6 font-heading text-3xl font-extrabold">Check Your Email</h1>
      <p className="mt-4 text-gray-600">
        {email
          ? `We've sent a verification link to ${email}. Click the link to verify your account.`
          : 'We have sent a verification link to your email address. Click the link to verify your account and get started.'}
      </p>
      <p className="mt-6 text-sm text-gray-500">
        Did not receive the email? Check your spam folder or{' '}
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          {resending ? 'Resending...' : 'resend the verification email'}
        </button>
        .
      </p>
      <Link
        href="/login"
        className="mt-8 inline-block text-sm font-medium text-brand-primary hover:underline"
      >
        Back to Log In
      </Link>
    </div>
  );
}
