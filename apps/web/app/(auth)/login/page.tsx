import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your myManager account.',
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      headline="Sign in to keep your social humming"
      subtext="Schedule, approve and analyse content across every platform from one calm workspace."
    >
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center text-[13px] text-text-muted">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
