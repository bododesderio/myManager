'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { useSession } from 'next-auth/react';
import { useAnalyticsOverview } from '@/lib/hooks/useAnalytics';
import { usePostFeed, usePosts, usePostCalendar } from '@/lib/hooks/usePosts';
import { usePendingApprovals, useApprovePost, useRequestRevision } from '@/lib/hooks/useApprovals';
import { useProjects } from '@/lib/hooks/useProjects';
import { useWorkspaceMembers } from '@/lib/hooks/useWorkspaces';
import { useSubscription } from '@/lib/hooks/useBilling';
import { useSocialAccounts } from '@/lib/hooks/useSocialAccounts';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import {
  Eye,
  FileText,
  TrendingUp,
  Clock,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
    monday,
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  x: '#000000',
  twitter: '#000000',
  linkedin: '#0A66C2',
  tiktok: '#010101',
  youtube: '#FF0000',
  pinterest: '#BD081C',
  threads: '#000000',
  google_business: '#4285F4',
  whatsapp: '#25D366',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  published: { bg: 'var(--color-accent-light)', color: 'var(--color-accent)' },
  scheduled: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  draft: { bg: 'var(--color-bg-card)', color: 'var(--color-text-muted)' },
  pending_approval: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
};

// ─── Role + Plan helpers ──────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────

export function HomeContent() {
  const { data: session } = useSession();
  const { startDate, endDate } = useMemo(() => getDateRange(30), []);
  const weekRange = useMemo(() => getWeekRange(), []);

  const role = useUserRole();
  const plan = useCurrentPlan();
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isEnterprise = plan === 'enterprise' || plan === 'business';

  // ─── Data queries ─────────────────────
  const analytics = useAnalyticsOverview(startDate, endDate);
  const feed = usePostFeed();
  const scheduled = usePosts({ status: 'scheduled', per_page: 5 });
  const calendarPosts = usePostCalendar(weekRange.startDate, weekRange.endDate);
  const pendingApprovals = usePendingApprovals();
  const projects = useProjects();
  const subscription = useSubscription();
  const socialAccounts = useSocialAccounts();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const members = useWorkspaceMembers(workspaceId);
  const approvePost = useApprovePost();
  const requestRevision = useRequestRevision();

  const overview = analytics.data as any;
  const recentPosts = ((feed.data as any)?.posts || (feed.data as any) || []).slice(0, 4);
  const scheduledPosts = ((scheduled.data as any)?.posts || (scheduled.data as any) || []).slice(0, 5);
  const calendarData = ((calendarPosts.data as any)?.posts || (calendarPosts.data as any) || []);
  const approvalItems = (Array.isArray(pendingApprovals.data) ? pendingApprovals.data : (pendingApprovals.data as any)?.items || []).slice(0, 3);
  const approvalCount = Array.isArray(pendingApprovals.data) ? pendingApprovals.data.length : (pendingApprovals.data as any)?.total ?? approvalItems.length;
  const projectsArr = ((projects.data as any)?.projects || projects.data as any || []).slice(0, 5);
  const membersArr = ((members.data as any)?.members || (members.data as any) || []).slice(0, 4);
  const accountsArr = (Array.isArray(socialAccounts.data) ? socialAccounts.data : (socialAccounts.data as any)?.accounts || []);

  const subData = subscription.data as any;
  const seatUsed = subData?.seats_used ?? subData?.member_count ?? membersArr.length ?? 0;
  const seatLimit = subData?.seats_limit ?? subData?.seat_limit ?? 5;

  // Quota data
  const quotaLimits = subData?.limits ?? subData?.quotas ?? {};
  const quotaUsage = subData?.usage ?? {};

  // Onboarding state
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const hasAccount = true; // always true if logged in
  const hasConnected = accountsArr.length > 0;
  const hasFirstPost = recentPosts.length > 0;
  const stepsCompleted = [hasAccount, hasConnected, hasFirstPost].filter(Boolean).length;
  const allStepsDone = stepsCompleted === 3;

  const queryError =
    analytics.error || feed.error || scheduled.error || pendingApprovals.error || subscription.error;

  return (
    <div className="space-y-5">
      {queryError && (
        <div className="rounded-brand border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Some dashboard data failed to load: {(queryError as Error)?.message ?? 'unknown error'}.
          <button
            type="button"
            onClick={() => {
              analytics.refetch();
              feed.refetch();
              scheduled.refetch();
              pendingApprovals.refetch();
              subscription.refetch();
            }}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* ── ONBOARDING STRIP ──────────────── */}
      {!onboardingDismissed && !allStepsDone && (
        <div
          className="relative rounded-card p-4"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
          }}
        >
          <button
            onClick={() => setOnboardingDismissed(true)}
            className="absolute right-3 top-3 rounded-btn p-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-between mb-2 pr-6">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
              Complete your setup &mdash; {stepsCompleted} of 3 steps done
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 w-full rounded-full mb-3" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(stepsCompleted / 3) * 100}%`,
                backgroundColor: 'var(--color-primary)',
              }}
            />
          </div>
          <div className="flex gap-6 text-[13px]">
            <OnboardingStep done={hasAccount} label="Account created" />
            <OnboardingStep done={hasConnected} label="Connect account" href="/settings/accounts" />
            <OnboardingStep done={hasFirstPost} label="First post" href="/compose" />
          </div>
        </div>
      )}

      {/* ── KPI METRICS ROW ───────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total reach"
          value={formatNumber(overview?.total_reach ?? 0)}
          change={overview?.reach_change}
          icon={<Eye className="h-4 w-4" />}
        />
        <KPICard
          label="Posts published"
          value={String(overview?.posts_published ?? recentPosts.length ?? 0)}
          change={overview?.posts_change}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPICard
          label="Avg engagement rate"
          value={`${(overview?.engagement_rate ?? 0).toFixed(1)}%`}
          change={overview?.engagement_rate_change}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          label="Posts in queue"
          value={String(scheduledPosts.length ?? 0)}
          change={null}
          icon={<Clock className="h-4 w-4" />}
          highlighted
        />
      </div>

      {/* ── PENDING APPROVALS (Owner/Admin) ── */}
      {isOwnerOrAdmin && approvalCount > 0 && (
        <Card>
          <CardHeader
            title="Pending approvals"
            badge={approvalCount}
            badgeColor="var(--color-warning)"
            action={{ label: 'View all', href: '/approvals' }}
          />
          <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {approvalItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {(item.user?.name ?? item.author_name ?? 'U')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                    {item.user?.name ?? item.author_name ?? 'Team member'}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    {item.caption ?? item.post?.caption ?? 'No caption'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(item.platforms ?? item.post?.platforms ?? []).slice(0, 3).map((p: string) => (
                    <PlatformDot key={p} platform={p} />
                  ))}
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {item.created_at ? timeAgo(item.created_at) : ''}
                </span>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => approvePost.mutate({ postId: item.id ?? item.post_id })}
                    className="rounded-btn px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => requestRevision.mutate({ postId: item.id ?? item.post_id, comment: 'Please revise' })}
                    className="rounded-btn px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
                    style={{
                      border: '1px solid var(--color-error)',
                      color: 'var(--color-error)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Revise
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── RECENT POSTS ──────────────────── */}
      <Card>
        <CardHeader title="Recent posts" action={{ label: 'View all', href: '/drafts' }} />
        {recentPosts.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {recentPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}` as Route}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-card)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {post.thumbnail_url ? (
                  <Image
                    src={post.thumbnail_url}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 flex-shrink-0 rounded-icon object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-icon"
                    style={{ backgroundColor: 'var(--color-bg-card)' }}
                  >
                    <FileText className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                    {post.caption || 'Untitled post'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {post.project?.name && (
                      <span className="text-[11px]" style={{ color: 'var(--color-primary)' }}>
                        {post.project.name}
                      </span>
                    )}
                    <div className="flex gap-1">
                      {(post.platforms ?? []).slice(0, 4).map((p: string) => (
                        <PlatformDot key={p} platform={p} />
                      ))}
                    </div>
                  </div>
                </div>
                <StatusBadge status={post.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState message="No posts yet" action={{ label: 'Create Post', href: '/compose' }} />
        )}
      </Card>

      {/* ── WEEKLY SCHEDULE + UPCOMING ─────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Weekly Schedule Mini Calendar */}
        <Card>
          <CardHeader title="Weekly schedule" action={{ label: 'Open calendar', href: '/calendar' }} />
          <div className="px-5 pb-4">
            <WeekCalendar monday={weekRange.monday} posts={calendarData} />
          </div>
        </Card>

        {/* Upcoming Posts */}
        <Card>
          <CardHeader title="Upcoming" action={{ label: 'View all', href: '/calendar' }} />
          {scheduledPosts.length > 0 ? (
            <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
              {scheduledPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}` as Route}
                  className="flex items-center gap-3 px-5 py-2.5 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-card)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span className="w-12 flex-shrink-0 text-[12px] font-medium" style={{ color: 'var(--color-text-2)' }}>
                    {post.scheduled_at
                      ? new Date(post.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                      {post.caption || 'Untitled'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(post.platforms ?? []).slice(0, 3).map((p: string) => (
                      <PlatformDot key={p} platform={p} />
                    ))}
                  </div>
                  <StatusBadge status={post.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="Nothing scheduled" action={{ label: 'Schedule a post', href: '/compose' }} />
          )}
        </Card>
      </div>

      {/* ── CLIENT PROJECTS (Enterprise only) ─ */}
      {isEnterprise && projectsArr.length > 0 && (
        <Card>
          <CardHeader title="Client projects" action={{ label: 'View all', href: '/projects' }} />
          <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
            {projectsArr.map((proj: any) => {
              const target = proj.monthly_target ?? proj.target ?? 20;
              const current = proj.posts_this_month ?? proj.post_count ?? 0;
              const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
              return (
                <div key={proj.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                      {proj.name}
                    </p>
                  </div>
                  <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {current}/{target}
                  </span>
                  <div className="w-28 flex-shrink-0">
                    <div className="h-[5px] w-full rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── TEAM ACTIVITY (Owner/Admin) ────── */}
      {isOwnerOrAdmin && (
        <Card>
          <CardHeader title="Team activity" />
          {membersArr.length > 0 ? (
            <>
              <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                {membersArr.map((m: any) => (
                  <div key={m.id ?? m.user_id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {(m.name ?? m.user?.name ?? 'U')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                        {m.name ?? m.user?.name ?? 'Team member'}
                      </p>
                      <p className="text-[11px] capitalize" style={{ color: 'var(--color-text-muted)' }}>
                        {m.role ?? 'member'}
                      </p>
                    </div>
                    <span className="text-[12px]" style={{ color: 'var(--color-text-2)' }}>
                      {m.posts_this_week ?? 0} posts submitted
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="px-5 py-3 text-[12px]"
                style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-light)' }}
              >
                Seats used: {seatUsed}/{seatLimit} &middot; +$15 to add more
              </div>
            </>
          ) : (
            <EmptyState message="No team members yet" action={{ label: 'Invite team', href: '/team' }} />
          )}
        </Card>
      )}

      {/* ── PLAN QUOTA BARS ───────────────── */}
      <Card>
        <CardHeader title="Usage" action={{ label: 'Upgrade', href: '/settings/billing' }} />
        <div className="space-y-4 px-5 pb-5">
          <QuotaBar
            label="Posts"
            used={quotaUsage.posts ?? overview?.posts_published ?? 0}
            limit={quotaLimits.posts ?? 50}
          />
          <QuotaBar
            label="Connected accounts"
            used={accountsArr.length}
            limit={quotaLimits.social_accounts ?? 5}
          />
          <QuotaBar
            label="Media storage"
            used={quotaUsage.storage_mb ?? 0}
            limit={quotaLimits.storage_mb ?? 500}
            unit="MB"
          />
          <QuotaBar
            label="AI credits"
            used={quotaUsage.ai_credits ?? 0}
            limit={quotaLimits.ai_credits ?? 100}
            warnAt90
          />
        </div>
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  badge,
  badgeColor,
  action,
}: {
  title: string;
  badge?: number;
  badgeColor?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{ borderBottom: '1px solid var(--color-border-light)' }}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        {badge != null && badge > 0 && (
          <span
            className="flex h-5 min-w-[20px] items-center justify-center rounded-badge px-1.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: badgeColor ?? 'var(--color-primary)' }}
          >
            {badge}
          </span>
        )}
      </div>
      {action && (
        <Link
          href={action.href as Route}
          className="flex items-center gap-0.5 text-[12px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-primary)' }}
        >
          {action.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  change,
  icon,
  highlighted,
}: {
  label: string;
  value: string;
  change?: number | null;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  const hasChange = change != null && change !== 0;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div
      className="rounded-card p-4"
      style={{
        backgroundColor: highlighted ? 'var(--color-stats-bg)' : 'var(--color-bg)',
        border: highlighted ? 'none' : '1px solid var(--color-border)',
        color: highlighted ? 'var(--color-stats-text)' : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-[12px] font-medium uppercase tracking-wide"
          style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}
        >
          {label}
        </p>
        <div
          className="rounded-icon p-1.5"
          style={{
            backgroundColor: highlighted ? 'rgba(255,255,255,0.15)' : 'var(--color-primary-light)',
            color: highlighted ? '#fff' : 'var(--color-primary)',
          }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hasChange ? (
        <p
          className="mt-1 text-[12px] font-medium"
          style={{ color: highlighted ? 'rgba(255,255,255,0.8)' : isPositive ? 'var(--color-accent)' : 'var(--color-error)' }}
        >
          {isPositive ? '+' : ''}{change}% vs last month
        </p>
      ) : (
        <p className="mt-1 text-[12px]" style={{ color: highlighted ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)' }}>
          --
        </p>
      )}
    </div>
  );
}

function OnboardingStep({ done, label, href }: { done: boolean; label: string; href?: string }) {
  const inner = (
    <span className="flex items-center gap-1.5">
      {done ? (
        <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
      ) : (
        <span
          className="inline-block h-3.5 w-3.5 rounded-full border-2"
          style={{ borderColor: 'var(--color-border)' }}
        />
      )}
      <span style={{ color: done ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
        {label}
      </span>
    </span>
  );

  if (!done && href) {
    return (
      <Link href={href as Route} className="hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

function PlatformDot({ platform }: { platform: string }) {
  return (
    <span
      title={platform}
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: PLATFORM_COLORS[platform] ?? 'var(--color-text-muted)' }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className="flex-shrink-0 rounded-badge px-2 py-0.5 text-[11px] font-medium capitalize"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {status?.replace('_', ' ') ?? 'draft'}
    </span>
  );
}

function EmptyState({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center py-8 text-center px-5">
      <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-2)' }}>{message}</p>
      {action && (
        <Link
          href={action.href as Route}
          className="mt-3 rounded-btn px-4 py-1.5 text-[13px] font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function WeekCalendar({ monday, posts }: { monday: Date; posts: any[] }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const dayPosts = posts.filter((p: any) => {
        const pDate = (p.scheduled_at ?? p.published_at ?? '').split('T')[0];
        return pDate === dateStr;
      });
      // Collect unique platforms for dots
      const platforms = [...new Set(dayPosts.flatMap((p: any) => p.platforms ?? []))].slice(0, 4);
      return { label, date: d.getDate(), isToday, platforms, count: dayPosts.length };
    });
  }, [monday, posts, todayStr]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {dayData.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {d.label}
          </span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{
              backgroundColor: d.isToday ? 'var(--color-primary)' : 'transparent',
              color: d.isToday ? '#fff' : 'var(--color-text)',
            }}
          >
            {d.date}
          </div>
          <div className="flex gap-0.5 h-2.5">
            {d.platforms.map((p) => (
              <span
                key={p}
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: PLATFORM_COLORS[p] ?? 'var(--color-text-muted)' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuotaBar({
  label,
  used,
  limit,
  unit,
  warnAt90,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  warnAt90?: boolean;
}) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const isRed = warnAt90 && pct > 90;

  let barColor = 'var(--color-primary)';
  if (isRed) barColor = 'var(--color-error)';
  else if (pct > 80) barColor = 'var(--color-warning)';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px]" style={{ color: 'var(--color-text-2)' }}>{label}</span>
        <span className="text-[12px] font-medium" style={{ color: isRed ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
          {used} / {limit}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="h-[5px] w-full rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
