import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your myManager account.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel headline="Welcome back" subtext="Sign in to manage your social media" />

      {/* Right Panel — Login form */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px] text-gray-400">Loading...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
