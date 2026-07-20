'use client';

import { useSession } from 'next-auth/react';
import { useLogout } from '@/lib/hooks/useAuth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Settings, LogOut, ChevronDown, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { usePendingApprovals } from '@/lib/hooks/useApprovals';
import { useSubscription } from '@/lib/hooks/useBilling';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Topbar() {
  const { data: session } = useSession();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = useWorkspaceStore((s) => s.getActiveWorkspace());
  const pendingApprovals = usePendingApprovals();
  const subscription = useSubscription();

  const approvalCount = Array.isArray(pendingApprovals.data) ? pendingApprovals.data.length
    : (pendingApprovals.data as any)?.total ?? (pendingApprovals.data as any)?.length ?? 0;

  const planLabel = (subscription.data as any)?.plan?.name ?? (subscription.data as any)?.plan_name ?? 'Free';
  const firstName = session?.user?.name?.split(' ')[0] ?? '';
  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? 'U';

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border bg-bg px-6">
      {/* Subtle accent gradient line at top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

      {/* LEFT: Greeting + context */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-bold leading-tight text-text">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span>{todayStr}</span>
            {activeWorkspace && (
              <>
                <span className="text-border">|</span>
                <span>{activeWorkspace.name}</span>
              </>
            )}
            <span className="rounded-badge bg-primary-light px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
              {planLabel}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2">
        {/* Pending approvals chip */}
        {approvalCount > 0 && (
          <Link
            href={"/approvals" as Route}
            className="flex items-center gap-1.5 rounded-btn bg-warning-light px-2.5 py-1.5 text-[12px] font-medium text-warning transition-opacity hover:opacity-80"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {approvalCount} pending
          </Link>
        )}

        {/* New post button */}
        <Link
          href={"/compose" as Route}
          className="flex items-center gap-1.5 rounded-btn bg-primary px-3 py-1.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>

        <CurrencyDisplay currency="USD" />
        <LanguageSwitcher />

        {/* Bell */}
        <button
          type="button"
          className="relative rounded-btn p-2 text-text-2 transition-colors hover:bg-bg-card hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          {/* Animated notification dot — shown when there are pending approvals */}
          {approvalCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-btn px-2 py-1 transition-colors hover:bg-bg-card"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {userInitial}
            </div>
            <ChevronDown className="hidden h-4 w-4 text-text-muted md:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-52 rounded-card border border-border bg-bg py-1 shadow-lg">
              <div className="px-4 py-2.5">
                <p className="text-sm font-medium text-text">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted">
                  {session?.user?.email || ''}
                </p>
              </div>
              <hr className="border-border-light" />
              <a
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-2 transition-colors hover:bg-bg-card"
              >
                <Settings className="h-4 w-4 text-text-muted" />
                Settings
              </a>
              <hr className="border-border-light" />
              <button
                type="button"
                onClick={() => logout.mutate()}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-error-light"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
