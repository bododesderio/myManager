import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailContent } from './VerifyEmailContent';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to activate your myManager account.',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 min-h-screen p-10 flex-col justify-between bg-primary">
        <div>
          <span className="text-white font-bold text-[14px]">myManager</span>
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-white">
            Verify your email
          </h2>
          <p className="text-[12px] text-white/65 mt-3">
            Email verification helps us keep your account secure and ensures you receive important notifications about your projects.
          </p>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-[12px] text-white/85">
            Tip: Check your spam or junk folder if you don&apos;t see the verification email in your inbox.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <Suspense fallback={<div className="text-center text-[13px] text-gray-500">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
