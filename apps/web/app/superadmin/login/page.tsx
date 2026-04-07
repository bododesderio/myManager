import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Superadmin · myManager',
  robots: { index: false, follow: false },
};

// There is a single workspace+superadmin login at /login. Credentials decide the destination.
// This route exists only as a backwards-compat redirect target for any old deep links.
export default function SuperadminLoginPage() {
  redirect('/login?next=/superadmin/dashboard');
}
