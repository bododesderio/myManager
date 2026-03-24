'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { getErrorMessage } from '@/lib/utils/error-messages';

function getSafeRedirectUrl(url: string | null): string {
  const defaultUrl = '/home';
  if (!url) return defaultUrl;
  try {
    const parsed = new URL(url, 'http://localhost');
    // Reject if origin is different (means it's an absolute URL to an external site)
    if (parsed.origin !== 'http://localhost') return defaultUrl;
    // Reject auth routes to prevent redirect loops
    if (parsed.pathname.startsWith('/login') || parsed.pathname.startsWith('/signup')) return defaultUrl;
    return parsed.pathname + parsed.search;
  } catch {
    return defaultUrl;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          totp_code: needs2FA ? totpCode : '',
        }),
      });
      const loginBody = await loginRes.json();

      if (!loginRes.ok) {
        setError(getErrorMessage(loginBody));
        setLoading(false);
        return;
      }

      if (loginBody?.user?.requiresTwoFactor) {
        setNeeds2FA(true);
        setError('Enter your 6-digit two-factor code to continue.');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        totp_code: needs2FA ? totpCode : '',
        remember: 'false',
        redirect: false,
      });

      if (!result || result.error) {
        setError('Unable to create a session. Please try again.');
        setLoading(false);
        return;
      }

      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user?.is_superadmin) {
        router.push('/admin/dashboard' as Route);
      } else {
        const callbackUrl = getSafeRedirectUrl(searchParams.get('next') || searchParams.get('callbackUrl'));
        router.push(callbackUrl as Route);
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-[340px]">
        {/* Header */}
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Welcome back
        </p>
        <h2 className="mt-1 text-[22px] font-bold text-text">Sign in</h2>
        <p className="mt-1 text-[13px] text-text-2">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-medium">
            Sign up
          </Link>
        </p>

        {/* Error box */}
        {error && (
          <div className="mt-4 rounded-input border border-error bg-error-light p-3 text-[12px] text-error">
            {error}
          </div>
        )}

        {searchParams.get('error') === 'session_expired' && !error && (
          <div className="mt-4 rounded-input border border-warning bg-warning-light p-3 text-[12px] text-warning">
            Your session has expired. Please log in again.
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[11px] font-medium text-text-2 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="text-[11px] font-medium text-text-2 mb-1 block">
              Password
            </label>
            <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-1.5 text-right">
              <Link href="/forgot-password" className="text-[11px] font-medium" style={{ color: 'var(--color-primary, #7F77DD)' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {/* 2FA */}
          {needs2FA && (
            <div>
              <label htmlFor="totp" className="block text-[11px] font-medium text-text-2 mb-1">
                Two-factor code
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full border border-border rounded-input px-3 py-2.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                Use the code from your authenticator app.
              </p>
            </div>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-btn py-3 text-[13px] font-bold transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary, #7F77DD)', color: '#FFFFFF' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google button */}
        <button
          type="button"
          disabled
          className="w-full border border-border rounded-btn py-2.5 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-[11px] font-medium text-text">Continue with Google</span>
          <span className="text-[9px] bg-bg-2 text-text-muted rounded-badge px-1.5 py-0.5">Coming soon</span>
        </button>

        {/* Terms */}
        <p className="text-[10px] text-text-muted text-center mt-4">
          By signing in, you agree to our{' '}
          <Link href="/legal/terms" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
