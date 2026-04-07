import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import SignupForm from './SignupForm';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create your myManager account.',
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      headline="Start managing social media smarter"
      subtext="Free forever for solo creators. Pay with mobile money when you're ready to scale."
    >
      <SignupForm />
    </AuthShell>
  );
}
