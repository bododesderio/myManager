'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './SuperadminLoginForm.module.css';

export function SuperadminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Pre-flight: verify credentials and is_superadmin against the API directly so
      // we can refuse non-superadmin accounts BEFORE setting any session cookie.
      const probe = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(needs2FA && totpCode ? { totp_code: totpCode } : {}),
        }),
      });
      const probeBody = await probe.json().catch(() => ({}));

      if (!probe.ok) {
        if (probeBody?.user?.requiresTwoFactor) {
          setNeeds2FA(true);
          setError('Enter your 6-digit two-factor code to continue.');
        } else {
          setError(probeBody?.message || 'Invalid credentials.');
        }
        setLoading(false);
        return;
      }

      if (!probeBody?.user?.is_superadmin) {
        setError(
          'This account is not authorised for the superadmin portal. Sign in at /login instead.',
        );
        setLoading(false);
        return;
      }

      // Now create the NextAuth session via credentials provider
      const result = await signIn('credentials', {
        email,
        password,
        ...(needs2FA && totpCode ? { totp_code: totpCode } : {}),
        redirect: false,
      });

      if (!result || result.error) {
        setError('Unable to create a superadmin session. Try again.');
        setLoading(false);
        return;
      }

      router.push('/superadmin/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearAnySession() {
    // If a workspace user is logged in, they have to clear their session before
    // they can sign into the superadmin portal in the same browser.
    await signOut({ redirect: false });
    setError(null);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <span className={styles.brandDot} />
          <span className={styles.brandLabel}>SUPERADMIN PORTAL</span>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Restricted to platform administrators. Workspace users should{' '}
          <a href="/login">sign in here</a>.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </label>

          {needs2FA && (
            <label className={styles.label}>
              Two-factor code
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className={styles.input}
                autoFocus
              />
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Signing in…' : 'Sign in to admin portal'}
          </button>

          <button
            type="button"
            onClick={handleClearAnySession}
            className={styles.clearLink}
          >
            Clear any existing workspace session
          </button>
        </form>
      </div>
    </div>
  );
}
