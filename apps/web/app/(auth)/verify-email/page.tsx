import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailContent } from './VerifyEmailContent';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to activate your myManager account.',
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <Suspense fallback={<div className="mt-8 text-center text-sm text-gray-500">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
