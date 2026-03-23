import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your myManager account password.',
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-extrabold text-center">Forgot Password</h1>
        <p className="mt-2 text-center text-gray-600">
          Enter your email address and we will send you a reset link.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
