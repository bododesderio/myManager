import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your myManager account password.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      headline="Reset your password"
      subtext="Enter the email on your account and we'll send a one-time reset link."
    >
      <h1 className="text-[22px] font-bold text-text">Forgot password</h1>
      <p className="mt-2 text-[13px] text-text-2">
        We&apos;ll email you a one-time reset link valid for 15 minutes.
      </p>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
