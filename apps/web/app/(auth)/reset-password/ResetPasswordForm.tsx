'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useResetPassword } from '@/lib/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/error-messages';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const resetPassword = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => {
          router.push('/login?message=password_reset');
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      },
    );
  }

  return (
    <>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full rounded-btn bg-primary py-3 text-[13px] font-bold text-white transition disabled:opacity-50"
        >
          {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <Link href="/login" className="font-medium text-brand-primary hover:underline">
          Back to Log In
        </Link>
      </div>
    </>
  );
}
