import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?next=/superadmin/dashboard');
  }

  // Workspace users cannot view the superadmin portal. They must log out first
  // and sign in again with a superadmin account.
  if (!session.user.is_superadmin) {
    redirect('/home');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-56 flex-1 p-6">{children}</main>
    </div>
  );
}
