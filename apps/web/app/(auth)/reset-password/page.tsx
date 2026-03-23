import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your myManager account.',
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-extrabold text-center">Reset Password</h1>
        <p className="mt-2 text-center text-gray-600">Enter your new password below.</p>
        <Suspense fallback={<div className="mt-8 text-center text-sm text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
