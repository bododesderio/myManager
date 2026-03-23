'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

type Tab = 'overview' | 'approvals' | 'calendar' | 'reports';

interface PortalData {
  project: {
    id: string;
    name: string;
    client_name: string;
    client_email: string | null;
    agency_name: string;
    brand_config: {
      logo_url?: string;
      primary_color?: string;
    } | null;
  };
  token: {
    label: string | null;
    expires_at: string | null;
  };
  metrics: {
    totalReach: number;
    totalImpressions: number;
    engagementRate: number;
    postsPublished: number;
  };
  weeklyReach: Array<{ week: string; value: number }>;
  platformBreakdown: Array<{ platform: string; reach: number }>;
  topPosts: Array<{
    id: string;
    caption: string;
    platforms: string[];
    reach: number;
    engagement_rate: number;
    published_at: string | null;
  }>;
  approvals: Array<{
    id: string;
    caption: string;
    platforms: string[];
    scheduled_at: string | null;
    status: string;
    latest_comment: string | null;
  }>;
  scheduled: Array<{
    id: string;
    caption: string;
    platforms: string[];
    scheduled_at: string | null;
    status: string;
  }>;
  reports: Array<{
    id: string;
    title: string;
    status: string;
    file_url: string | null;
    file_format: string | null;
    generated_at: string | null;
    created_at: string;
  }>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(value: string | null) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status: string) {
  switch (status) {
    case 'APPROVED_BY_CLIENT':
      return 'Approved';
    case 'REVISION_REQUESTED':
      return 'Revision requested';
    case 'PENDING_CLIENT_APPROVAL':
      return 'Awaiting approval';
    case 'SCHEDULED':
      return 'Scheduled';
    case 'PUBLISHED':
      return 'Published';
    default:
      return status.replaceAll('_', ' ').toLowerCase();
  }
}

function statusTone(status: string) {
  if (status === 'APPROVED_BY_CLIENT' || status === 'PUBLISHED') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'REVISION_REQUESTED') {
    return 'bg-red-100 text-red-700';
  }
  if (status === 'PENDING_CLIENT_APPROVAL') {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-slate-100 text-slate-700';
}

function PlatformChips({ platforms }: { platforms: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <span
          key={platform}
          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
        >
          {platform}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-brand border border-dashed bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-brand border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{caption}</p>
    </div>
  );
}

function OverviewTab({ data }: { data: PortalData }) {
  const maxReach = Math.max(...data.weeklyReach.map((item) => item.value), 1);
  const totalPlatformReach = data.platformBreakdown.reduce((sum, item) => sum + item.reach, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Reach"
          value={formatNumber(data.metrics.totalReach)}
          caption="Across published content"
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(data.metrics.totalImpressions)}
          caption="Tracked from synced analytics"
        />
        <MetricCard
          title="Engagement Rate"
          value={formatPercent(data.metrics.engagementRate)}
          caption="Likes, comments, shares, and saves"
        />
        <MetricCard
          title="Published Posts"
          value={formatNumber(data.metrics.postsPublished)}
          caption="Posts already live"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-brand border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Weekly Reach</h2>
            <span className="text-xs text-slate-400">Last 4 weeks</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {data.weeklyReach.map((item) => (
              <div key={item.week} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs text-slate-400">{formatNumber(item.value)}</div>
                <div
                  className="w-full rounded-t-md bg-brand-primary/80"
                  style={{ height: `${Math.max((item.value / maxReach) * 100, 6)}%` }}
                />
                <div className="text-xs text-slate-500">{item.week}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-brand border bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-slate-900">Platform Mix</h2>
          <div className="mt-4 space-y-4">
            {data.platformBreakdown.map((item) => {
              const share = totalPlatformReach > 0 ? (item.reach / totalPlatformReach) * 100 : 0;
              return (
                <div key={item.platform}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item.platform}</span>
                    <span className="text-xs text-slate-500">
                      {formatNumber(item.reach)} reach
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${Math.max(share, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.platformBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">No analytics breakdown available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-brand border bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Top Performing Posts</h2>
        <div className="mt-4 space-y-3">
          {data.topPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-brand bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">{post.caption}</p>
                  <PlatformChips platforms={post.platforms} />
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Reach {formatNumber(post.reach)}</span>
                  <span>Engagement {formatPercent(post.engagement_rate)}</span>
                  <span>{formatShortDate(post.published_at)}</span>
                </div>
              </div>
            </div>
          ))}
          {data.topPosts.length === 0 && (
            <EmptyState
              title="No published posts yet"
              description="Published content will appear here once analytics have synced."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab({
  token,
  approvals,
}: {
  token: string;
  approvals: PortalData['approvals'];
}) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const approveMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) =>
      apiClient.post(`/portal/${token}/approvals/${id}/approve`, { comment }),
    onSuccess: async (_, variables) => {
      setFeedback((prev) => ({ ...prev, [variables.id]: 'Post approved.' }));
      await queryClient.invalidateQueries({ queryKey: ['portal', token] });
    },
    onError: (_error, variables) => {
      setFeedback((prev) => ({ ...prev, [variables.id]: 'Approval failed. Please try again.' }));
    },
  });

  const reviseMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) =>
      apiClient.post(`/portal/${token}/approvals/${id}/revise`, { comment }),
    onSuccess: async (_, variables) => {
      setFeedback((prev) => ({ ...prev, [variables.id]: 'Revision request sent.' }));
      setComments((prev) => ({ ...prev, [variables.id]: '' }));
      await queryClient.invalidateQueries({ queryKey: ['portal', token] });
    },
    onError: (_error, variables) => {
      setFeedback((prev) => ({ ...prev, [variables.id]: 'Revision request failed. Add a comment and try again.' }));
    },
  });

  const busyId = approveMutation.variables?.id ?? reviseMutation.variables?.id ?? null;

  if (approvals.length === 0) {
    return (
      <EmptyState
        title="Nothing is waiting for approval"
        description="New client approvals will appear here automatically."
      />
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((item) => {
        const isBusy = busyId === item.id && (approveMutation.isPending || reviseMutation.isPending);
        return (
          <div key={item.id} className="rounded-brand border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                  <span className="text-xs text-slate-500">
                    Scheduled {formatDateTime(item.scheduled_at)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900">{item.caption}</p>
                <PlatformChips platforms={item.platforms} />
                {item.latest_comment && (
                  <div className="rounded-brand bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Latest comment: {item.latest_comment}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t pt-4">
              <textarea
                value={comments[item.id] ?? ''}
                onChange={(event) =>
                  setComments((prev) => ({ ...prev, [item.id]: event.target.value }))
                }
                rows={3}
                className="w-full rounded-brand border px-3 py-2 text-sm outline-none ring-0"
                placeholder="Optional note for approval, or required feedback for revisions."
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    approveMutation.mutate({
                      id: item.id,
                      comment: comments[item.id]?.trim() || undefined,
                    })
                  }
                  className="rounded-brand bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isBusy || !(comments[item.id] ?? '').trim()}
                  onClick={() =>
                    reviseMutation.mutate({
                      id: item.id,
                      comment: (comments[item.id] ?? '').trim(),
                    })
                  }
                  className="rounded-brand border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Request Revision
                </button>
              </div>
              {feedback[item.id] && (
                <p className="text-sm text-slate-500">{feedback[item.id]}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarTab({ scheduled }: { scheduled: PortalData['scheduled'] }) {
  if (scheduled.length === 0) {
    return (
      <EmptyState
        title="No scheduled posts yet"
        description="Scheduled content will appear here once the publishing calendar is populated."
      />
    );
  }

  return (
    <div className="space-y-3">
      {scheduled.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-brand border bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                {statusLabel(item.status)}
              </span>
              <span className="text-xs text-slate-500">{formatDateTime(item.scheduled_at)}</span>
            </div>
            <p className="text-sm font-medium text-slate-900">{item.caption}</p>
            <PlatformChips platforms={item.platforms} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab({ reports }: { reports: PortalData['reports'] }) {
  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports available yet"
        description="Generated reports will show up here once your team publishes them."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex flex-col gap-3 rounded-brand border bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">{report.title}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>{statusLabel(report.status)}</span>
              <span>{report.file_format ?? 'Unknown format'}</span>
              <span>{formatShortDate(report.generated_at ?? report.created_at)}</span>
            </div>
          </div>
          {report.file_url ? (
            <a
              href={report.file_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-brand border border-brand-primary/30 bg-brand-primary/5 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
            >
              Open Report
            </a>
          ) : (
            <span className="text-sm text-slate-400">File pending upload</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PortalContent({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const portalQuery = useQuery({
    queryKey: ['portal', token],
    queryFn: () => apiClient.get<PortalData>(`/portal/${token}`),
    retry: false,
  });

  const tabs = useMemo<Array<{ id: Tab; label: string; badge?: number }>>(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'approvals', label: 'Approvals', badge: portalQuery.data?.approvals.length ?? 0 },
      { id: 'calendar', label: 'Scheduled' },
      { id: 'reports', label: 'Reports' },
    ],
    [portalQuery.data?.approvals.length],
  );

  if (portalQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-16 animate-pulse rounded-brand bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-brand bg-slate-200" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-brand bg-slate-200" />
        </div>
      </div>
    );
  }

  if (portalQuery.isError || !portalQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
        <div className="max-w-lg rounded-brand border bg-white p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-slate-900">Portal unavailable</h1>
          <p className="mt-3 text-sm text-slate-500">
            This portal link is invalid, expired, or no longer active.
          </p>
        </div>
      </div>
    );
  }

  const { data } = portalQuery;
  const accent = data.project.brand_config?.primary_color || 'var(--brand-primary)';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white" style={{ borderColor: 'rgba(15, 23, 42, 0.08)' }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Managed by {data.project.agency_name}
            </p>
            <h1 className="font-heading text-2xl font-bold text-slate-900">
              {data.project.name}
            </h1>
            <p className="text-sm text-slate-500">
              {data.project.client_name}
              {data.project.client_email ? ` • ${data.project.client_email}` : ''}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>{data.token.label || 'Client portal'}</p>
            <p>Expires {formatShortDate(data.token.expires_at)}</p>
          </div>
        </div>
      </header>

      <nav className="border-b bg-white" style={{ borderColor: 'rgba(15, 23, 42, 0.08)' }}>
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative whitespace-nowrap py-4 text-sm font-semibold transition"
                style={{
                  color: active ? accent : 'rgb(100 116 139)',
                  borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
                }}
              >
                {tab.label}
                {tab.badge ? (
                  <span
                    className="ml-2 rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'approvals' && <ApprovalsTab token={token} approvals={data.approvals} />}
        {activeTab === 'calendar' && <CalendarTab scheduled={data.scheduled} />}
        {activeTab === 'reports' && <ReportsTab reports={data.reports} />}
      </main>
    </div>
  );
}
