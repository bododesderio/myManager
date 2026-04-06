import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your myManager account.',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 min-h-screen p-10 flex-col justify-between bg-primary">
        <div>
          <span className="text-white font-bold text-[14px]">myManager</span>
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-white">
            Set a new password
          </h2>
          <p className="text-[12px] text-white/65 mt-3">
            Choose a strong password that you haven&apos;t used before. Your password should be at least 8 characters long.
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-[12px] text-white/85">
            Tip: A strong password combines uppercase and lowercase letters, numbers, and special characters.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
          <h1 className="text-[22px] font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-[13px] text-gray-600">
            Enter your new password below.
          </p>
          <Suspense fallback={<div className="mt-8 text-center text-[13px] text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
