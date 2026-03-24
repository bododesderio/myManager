import type { Metadata } from 'next';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import SignupForm from './SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your myManager account.',
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel headline="Start managing social media smarter" subtext="Join thousands of creators and agencies across Africa." />
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <SignupForm />
      </div>
    </div>
  );
}
