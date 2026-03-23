'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  FileText,
  Image,
  LayoutTemplate,
  BarChart3,
  FileBarChart,
  FolderKanban,
  Users,
  CheckCircle2,
  MessageSquare,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useWorkspaces, useWorkspaceMembers } from '@/lib/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { usePendingApprovals } from '@/lib/hooks/useApprovals';
import { usePosts } from '@/lib/hooks/usePosts';
import { useProjects } from '@/lib/hooks/useProjects';
import { useSubscription } from '@/lib/hooks/useBilling';
import { useUIStore } from '@/lib/stores/ui.store';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  roles?: string[];       // restrict to these roles; undefined = all
  planGate?: string[];    // restrict to these plans; undefined = all
}

/** Derive role from workspace membership or session */
function useUserRole(): string {
  const { data: session } = useSession();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const members = useWorkspaceMembers(workspaceId);
  const membersArr = (members.data as any)?.members ?? (members.data as any) ?? [];
  const email = session?.user?.email;
  const member = membersArr.find?.((m: any) => m.email === email || m.user?.email === email);
  return member?.role ?? (session as any)?.user?.role ?? 'member';
}

function useCurrentPlan(): string {
  const sub = useSubscription();
  return (sub.data as any)?.plan?.slug ?? (sub.data as any)?.plan_name ?? 'free';
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeWorkspace = useWorkspaceStore((s) => s.getActiveWorkspace());

  const role = useUserRole();
  const plan = useCurrentPlan();

  // Badge counts
  const pendingApprovals = usePendingApprovals();
  const drafts = usePosts({ status: 'draft' });
  const projects = useProjects();
  const subscription = useSubscription();

  const approvalCount = Array.isArray(pendingApprovals.data) ? pendingApprovals.data.length
    : (pendingApprovals.data as any)?.total ?? (pendingApprovals.data as any)?.length ?? 0;
  const draftCount = Array.isArray(drafts.data) ? drafts.data.length
    : (drafts.data as any)?.total ?? (drafts.data as any)?.posts?.length ?? 0;
  const projectCount = Array.isArray(projects.data) ? projects.data.length
    : (projects.data as any)?.total ?? (projects.data as any)?.length ?? 0;

  const subData = subscription.data as any;
  const seatUsed = subData?.seats_used ?? subData?.member_count ?? 0;
  const seatLimit = subData?.seats_limit ?? subData?.seat_limit ?? 5;
  const planLabel = subData?.plan?.name ?? subData?.plan_name ?? 'Free';

  useWorkspaces();

  const navItems: NavItem[] = [
    { href: '/home', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/compose', label: 'Compose', icon: PenSquare },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/drafts', label: 'Drafts', icon: FileText, badge: draftCount || undefined },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/reports', label: 'Reports', icon: FileBarChart },
    { href: '/media', label: 'Media library', icon: Image },
    { href: '/templates', label: 'Templates', icon: LayoutTemplate },
    // Owner + Admin only
    { href: '/approvals', label: 'Approvals', icon: CheckCircle2, badge: approvalCount || undefined, roles: ['owner', 'admin'] },
    { href: '/team', label: 'Team', icon: Users, roles: ['owner', 'admin'] },
    // Enterprise only
    { href: '/projects', label: 'Projects', icon: FolderKanban, badge: projectCount || undefined, planGate: ['enterprise', 'business'] },
    { href: '/conversations', label: 'Conversations', icon: MessageSquare, planGate: ['enterprise', 'business'] },
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.planGate && !item.planGate.includes(plan)) return false;
    return true;
  });

  const firstName = session?.user?.name?.split(' ')[0] ?? '';
  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <aside
      className={`flex flex-col border-r transition-all`}
      style={{
        width: sidebarCollapsed ? 64 : 216,
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-between px-3 py-3">
        {!sidebarCollapsed && (
          <Link href="/home" className="font-heading text-lg font-extrabold px-1" style={{ color: 'var(--color-primary)' }}>
            myManager
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-btn p-1.5 hover:opacity-80"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Workspace header */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-3 rounded-card p-3" style={{ backgroundColor: 'var(--color-bg-card)' }}>
          <WorkspaceSwitcher />
          <div className="mt-2 flex items-center gap-2 px-2">
            <span
              className="rounded-badge px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              {planLabel}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {seatUsed}/{seatLimit} seats
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              title={sidebarCollapsed ? item.label : undefined}
              className="flex items-center gap-2.5 rounded-btn px-2.5 py-2 text-[13px] transition"
              style={{
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-2)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className="flex h-5 min-w-[20px] items-center justify-center rounded-badge px-1 text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-2 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-btn px-2.5 py-2 text-[13px] transition"
          style={{ color: 'var(--color-text-2)', fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-card)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {!sidebarCollapsed && 'Settings'}
        </Link>

        {!sidebarCollapsed && (
          <div className="mt-2 flex items-center gap-2.5 px-2.5 py-1.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold" style={{ color: 'var(--color-text)' }}>
                {session?.user?.name || 'User'}
              </p>
              <p className="truncate text-[11px] capitalize" style={{ color: 'var(--color-text-muted)' }}>
                {role}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
