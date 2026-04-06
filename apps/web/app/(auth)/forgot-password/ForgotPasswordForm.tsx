'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForgotPassword } from '@/lib/hooks/useAuth';

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => setSent(true),
        onError: () => setSent(true), // Don't reveal if email exists
      },
    );
  }

  if (sent) {
    return (
      <div className="mt-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-gray-600">
          If an account with that email exists, we&apos;ve sent a password reset link.
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

  return (
    <>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <button
          type="submit"
          disabled={forgotPassword.isPending}
          className="w-full rounded-btn bg-primary py-3 text-[13px] font-bold text-white transition disabled:opacity-50"
        >
          {forgotPassword.isPending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-brand-primary hover:underline">
          Log in
        </Link>
      </div>
    </>
  );
}
