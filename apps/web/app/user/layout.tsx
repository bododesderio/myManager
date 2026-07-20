import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

/**
 * Auth-gated and per-user: never statically prerender. Without this Next tries
 * to prerender at build time, where SessionProvider has no React runtime:
 *   TypeError: Cannot read properties of null (reading 'useState')
 */
export const dynamic = 'force-dynamic';


export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-bg-2">
          {children}
        </main>
      </div>
    </div>
  );
}
