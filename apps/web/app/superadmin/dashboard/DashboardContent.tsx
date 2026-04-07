'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import styles from './DashboardContent.module.css';

interface AdminMetricsResponse {
  mrr: number;
  totalActiveSubscriptions: number;
  planBreakdown: Array<{ plan_id: string; _count: { id: number } }>;
}

interface MrrHistoryPoint {
  month: string;
  mrr: number;
  subscriptionCount: number;
}

interface PlanDistributionPoint {
  planId: string;
  planName: string;
  planSlug: string;
  count: number;
}

interface ApiHealthResponse {
  status: string;
  checks: Record<string, { status: string; latencyMs?: number; error?: string }>;
}

interface QueueStatsResponse {
  queues: Record<string, { waiting?: number; active?: number; failed?: number; completed?: number }>;
}

interface PendingActionsResponse {
  posts: {
    pendingApprovals: number;
    pendingClientApprovals: number;
    scheduledPosts: number;
    failedPosts: number;
  };
  users: {
    totalUsers: number;
    activeSubscriptions: number;
    recentSignups: number;
  };
}

interface UserListResponse {
  users: Array<{ id: string; name: string; email: string; plan: string; createdAt: string }>;
  total: number;
}

interface LeadsResponse {
  items: Array<{ id: string; name: string; email: string; status: string; created_at: string }>;
  total: number;
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-brand border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

export default function DashboardContent() {
  const metrics = useQuery({
    queryKey: ['admin-dashboard', 'metrics'],
    queryFn: () => apiClient.get<AdminMetricsResponse>('/billing/admin/mrr'),
  });
  const mrrHistory = useQuery({
    queryKey: ['admin-dashboard', 'mrr-history'],
    queryFn: () => apiClient.get<{ data: MrrHistoryPoint[] }>('/billing/admin/mrr-history?months=6'),
  });
  const planDistribution = useQuery({
    queryKey: ['admin-dashboard', 'plan-distribution'],
    queryFn: () => apiClient.get<{ data: PlanDistributionPoint[] }>('/billing/admin/plan-distribution'),
  });
  const apiHealth = useQuery({
    queryKey: ['admin-dashboard', 'api-health'],
    queryFn: () => apiClient.get<ApiHealthResponse>('/admin/api-health'),
    refetchInterval: 30000,
  });
  const queueStats = useQuery({
    queryKey: ['admin-dashboard', 'queue-stats'],
    queryFn: () => apiClient.get<QueueStatsResponse>('/admin/queue/stats'),
    refetchInterval: 30000,
  });
  const pendingActions = useQuery({
    queryKey: ['admin-dashboard', 'pending-actions'],
    queryFn: () => apiClient.get<PendingActionsResponse>('/admin/pending-actions'),
  });
  const users = useQuery({
    queryKey: ['admin-dashboard', 'recent-users'],
    queryFn: () => apiClient.get<UserListResponse>('/users/admin/list?limit=5'),
  });
  const leads = useQuery({
    queryKey: ['admin-dashboard', 'recent-leads'],
    queryFn: () => apiClient.get<LeadsResponse>('/admin/leads?limit=5'),
  });

  const queueRows = useMemo(() => {
    const data = queueStats.data?.queues ?? {};
    return Object.entries(data)
      .map(([name, value]) => ({
        name,
        waiting: value.waiting ?? 0,
        active: value.active ?? 0,
        failed: value.failed ?? 0,
      }))
      .sort((a, b) => b.failed - a.failed || b.waiting - a.waiting)
      .slice(0, 8);
  }, [queueStats.data]);

  const planRows = planDistribution.data?.data ?? [];
  const mrrRows = mrrHistory.data?.data ?? [];
  const maxMrr = Math.max(...mrrRows.map((row) => row.mrr), 1);
  const healthChecks = apiHealth.data?.checks ?? {};

  const totalUsers = pendingActions.data?.users.totalUsers ?? users.data?.total ?? 0;
  const totalLeads = leads.data?.total ?? 0;
  const totalFailedJobs = queueRows.reduce((sum, row) => sum + row.failed, 0);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Live operational view across revenue, users, queues, and content review.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href={'/admin/queue' as Route} className="rounded-brand border px-4 py-2 text-gray-700 transition hover:bg-gray-50">
            Queue Monitor
          </Link>
          <Link href={'/admin/users' as Route} className="rounded-brand bg-brand-primary px-4 py-2 font-semibold text-white transition hover:bg-brand-primary-dark">
            Users
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card
          title="MRR"
          value={`$${(metrics.data?.mrr ?? 0).toLocaleString()}`}
          subtitle={`${metrics.data?.totalActiveSubscriptions ?? 0} active subscriptions`}
        />
        <Card
          title="Users"
          value={totalUsers.toLocaleString()}
          subtitle={`${pendingActions.data?.users.recentSignups ?? 0} new in 24h`}
        />
        <Card
          title="Leads"
          value={totalLeads.toLocaleString()}
          subtitle="Open contact and sales leads"
        />
        <Card
          title="Pending Reviews"
          value={(pendingActions.data?.posts.pendingApprovals ?? 0) + (pendingActions.data?.posts.pendingClientApprovals ?? 0)}
          subtitle={`${pendingActions.data?.posts.pendingClientApprovals ?? 0} awaiting client approval`}
        />
        <Card
          title="Queue Failures"
          value={totalFailedJobs}
          subtitle={`${queueRows.length} queue groups checked`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-brand border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">MRR Trend</h2>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {mrrRows.map((row) => (
              <div key={row.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs text-gray-400">${Math.round(row.mrr).toLocaleString()}</div>
                <div
                  className={`w-full rounded-t-md bg-brand-primary/80 ${styles.barFill}`}
                  style={{ ['--bar-height' as string]: `${Math.max((row.mrr / maxMrr) * 100, 6)}%` } as React.CSSProperties}
                />
                <div className="text-xs text-gray-500">{row.month.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-brand border bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Plan Mix</h2>
          <div className="mt-4 space-y-3">
            {planRows.map((row) => (
              <div key={row.planId} className="flex items-center justify-between rounded-brand bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium text-gray-700">{row.planName}</span>
                <span className="text-sm font-semibold text-gray-900">{row.count}</span>
              </div>
            ))}
            {planRows.length === 0 && <p className="text-sm text-gray-400">No active plan data yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-brand border bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Infrastructure Health</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(healthChecks).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-brand bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium capitalize text-gray-800">{key}</p>
                  <p className="text-xs text-gray-400">{value.latencyMs ?? 0} ms</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    value.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {value.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-brand border bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="font-heading text-lg font-semibold">Queue Summary</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Queue</th>
                  <th className="px-3 py-2 text-right">Waiting</th>
                  <th className="px-3 py-2 text-right">Active</th>
                  <th className="px-3 py-2 text-right">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queueRows.map((row) => (
                  <tr key={row.name}>
                    <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.waiting}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.active}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${row.failed > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {row.failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-brand border bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Recent Users</h2>
          <div className="mt-4 space-y-3">
            {users.data?.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-brand bg-gray-50 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-700">{user.plan}</p>
                  <p className="text-xs text-gray-400">{timeAgo(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-brand border bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Lead Queue</h2>
          <div className="mt-4 space-y-3">
            {leads.data?.items.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-brand bg-gray-50 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-400">{lead.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-700">{lead.status}</p>
                  <p className="text-xs text-gray-400">{timeAgo(lead.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
