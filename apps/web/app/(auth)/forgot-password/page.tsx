import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your myManager account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 min-h-screen p-10 flex-col justify-between" style={{ backgroundColor: 'var(--color-primary, #7F77DD)' }}>
        <div>
          <span className="text-white font-bold text-[14px]">myManager</span>
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-white">
            Reset your password
          </h2>
          <p className="text-[12px] text-white/65 mt-3">
            No worries — it happens to the best of us. Enter your email and we will send you a link to reset your password.
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-[12px] text-white/85">
            Tip: Use a password manager to generate and store strong passwords for all your accounts.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
          <h1 className="text-[22px] font-bold text-gray-900">Forgot Password</h1>
          <p className="mt-2 text-[13px] text-gray-600">
            Enter your email address and we will send you a reset link.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
