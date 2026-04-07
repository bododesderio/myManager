import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow the /superadmin/login page to render without an existing session.
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') || hdrs.get('x-invoke-path') || '';
  const isLoginPage = pathname === '/superadmin/login';

  const session = await auth();

  if (!session?.user) {
    if (isLoginPage) {
      // Render the login page chrome-free
      return <>{children}</>;
    }
    redirect('/superadmin/login');
  }

  // Workspace users cannot view the superadmin portal. They must log out first.
  if (!session.user.is_superadmin) {
    redirect('/home');
  }

  // Superadmin already authenticated → skip login page
  if (isLoginPage) {
    redirect('/superadmin/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-56 flex-1 p-6">{children}</main>
    </div>
  );
}
