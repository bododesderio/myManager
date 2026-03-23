import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your myManager account.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-primary min-h-screen p-10 flex-col justify-between">
        {/* Top: Logo */}
        <div>
          <span className="text-white font-bold text-[14px]">myManager</span>
        </div>

        {/* Middle: Value proposition */}
        <div>
          <h2 className="text-[24px] font-bold text-white">
            The smarter way to manage social media
          </h2>
          <p className="text-[12px] text-white/65 mt-3">
            Everything you need to plan, create, schedule, and analyze your social media content — all in one platform built for teams that move fast.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Schedule posts across 10 platforms',
              'AI-powered captions and hashtags',
              'Team collaboration and approvals',
              'Built for African businesses',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                <span className="text-[12px] text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Testimonial */}
        <div className="bg-white/10 rounded-card p-4">
          <p className="text-[12px] text-white/85 italic">
            &ldquo;myManager transformed how we handle social media for our clients. We went from juggling spreadsheets to a seamless workflow in days.&rdquo;
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-white">
              AO
            </div>
            <div>
              <p className="text-[12px] text-white font-medium">Adaeze Okonkwo</p>
              <p className="text-[11px] text-white/65">Marketing Lead, BrightEdge Agency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px] text-text-muted">Loading...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
