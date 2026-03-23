import type { Metadata } from 'next';
import SignupForm from './SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your myManager account and start your free trial.',
};

export default function SignupPage() {
  return <SignupForm />;
}
