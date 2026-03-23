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
    <header
      className="flex h-14 items-center justify-between border-b px-6"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      {/* LEFT: Greeting + context */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            <span>{todayStr}</span>
            {activeWorkspace && (
              <>
                <span style={{ color: 'var(--color-border)' }}>|</span>
                <span>{activeWorkspace.name}</span>
              </>
            )}
            <span
              className="rounded-badge px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
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
            className="flex items-center gap-1.5 rounded-btn px-2.5 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {approvalCount} pending
          </Link>
        )}

        {/* New post button */}
        <Link
          href={"/compose" as Route}
          className="flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>

        <CurrencyDisplay currency="USD" />
        <LanguageSwitcher />

        {/* Bell */}
        <button
          className="relative rounded-btn p-2 transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text-2)' }}
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-btn px-2 py-1 transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-card)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              {userInitial}
            </div>
            <ChevronDown className="hidden md:block h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-52 rounded-card border py-1 shadow-lg"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
              <div className="px-4 py-2.5">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {session?.user?.email || ''}
                </p>
              </div>
              <hr style={{ borderColor: 'var(--color-border-light)' }} />
              <a
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--color-text-2)' }}
              >
                <Settings className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                Settings
              </a>
              <hr style={{ borderColor: 'var(--color-border-light)' }} />
              <button
                onClick={() => logout.mutate()}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--color-error)' }}
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
