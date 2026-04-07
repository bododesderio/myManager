import type { ReactNode } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const Sidebar = dynamic(
  () => import('@/components/layout/Sidebar').then((m) => ({ default: m.Sidebar })),
  {
    loading: () => <div className="w-16 shrink-0 border-r border-border bg-bg" />,
  },
);

const Topbar = dynamic(
  () => import('@/components/layout/Topbar').then((m) => ({ default: m.Topbar })),
  {
    loading: () => <div className="h-14 border-b border-border bg-bg" />,
  },
);

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Superadmin and workspace users are mutually exclusive: superadmins must use the
  // /superadmin portal. They are not permitted to act as a workspace user without
  // logging out first. (See /superadmin/layout.tsx for the inverse check.)
  if (session.user.is_superadmin) {
    redirect('/superadmin/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<div className="w-16 shrink-0 border-r border-border bg-bg" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="h-14 border-b border-border bg-bg" />}>
          <Topbar />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-bg-2 p-6">
          <div className="animate-[fadeIn_0.3s_ease-in-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
