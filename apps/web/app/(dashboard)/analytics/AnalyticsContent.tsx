'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useAnalyticsOverview,
  useDailyAnalytics,
  useTopPosts,
} from '@/lib/hooks/useAnalytics';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function AnalyticsContent() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const overview = useAnalyticsOverview(startDate, endDate);
  const daily = useDailyAnalytics(startDate, endDate);
  const topPosts = useTopPosts(startDate, endDate);

  const stats = overview.data?.data ?? overview.data;
  const dailyData = daily.data?.data ?? daily.data ?? [];
  const topPostsData = topPosts.data?.data ?? topPosts.data ?? [];

  const platforms = ['Facebook', 'Instagram', 'X', 'LinkedIn', 'TikTok', 'YouTube'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Analytics Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track performance across all connected platforms.
        </p>
      </div>

      {/* Date range picker + nav links */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-brand border px-3 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-brand border px-3 py-1.5 text-sm"
          />
        </label>
        <div className="ml-auto flex gap-2">
          <Link
            href="/analytics/hashtags"
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
          >
            Hashtag Analytics
          </Link>
          <Link
            href="/analytics/benchmarks"
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
          >
            Benchmarks
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      {overview.isLoading ? (
        <StatCardSkeletonGrid count={4} />
      ) : overview.isError ? (
        <div className="rounded-brand border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load analytics overview. {(overview.error as Error)?.message ?? ''}{' '}
          <button type="button" onClick={() => overview.refetch()} className="ml-1 underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Reach', value: stats?.reach ?? '-' },
            { label: 'Impressions', value: stats?.impressions ?? '-' },
            { label: 'Engagements', value: stats?.engagements ?? '-' },
            {
              label: 'Engagement Rate',
              value: stats?.engagementRate != null ? `${stats.engagementRate}%` : '-',
            },
          ].map((metric) => (
            <div key={metric.label} className="rounded-brand border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {typeof metric.value === 'number'
                  ? metric.value.toLocaleString()
                  : metric.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Time-series chart */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Engagement Over Time</h2>
        {daily.isLoading ? (
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="h-full w-full animate-pulse rounded bg-gray-100" />
          </div>
        ) : dailyData.length > 0 ? (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="engagements"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">No daily data available for this range.</p>
        )}
      </div>

      {/* Top posts table */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Top Posts</h2>
        {topPosts.isLoading ? (
          <div className="mt-4">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : topPostsData.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Post</th>
                  <th className="pb-2 pr-4 font-medium">Platform</th>
                  <th className="pb-2 pr-4 font-medium">Impressions</th>
                  <th className="pb-2 font-medium">Engagements</th>
                </tr>
              </thead>
              <tbody>
                {topPostsData.map((post: Record<string, unknown>, i: number) => (
                  <tr key={(post.id as string) ?? i} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      {(post.caption as string)?.slice(0, 60) ?? `Post #${post.id}`}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{post.platform as string}</td>
                    <td className="py-3 pr-4">{(post.impressions as number)?.toLocaleString()}</td>
                    <td className="py-3">{(post.engagements as number)?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">No top posts for this range.</p>
        )}
      </div>

      {/* Platform breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => (
          <Link
            key={platform}
            href={`/analytics/${platform.toLowerCase()}`}
            className="rounded-brand border bg-white p-5 shadow-sm transition hover:border-brand-primary"
          >
            <h3 className="font-heading font-semibold">{platform}</h3>
            <p className="mt-1 text-sm text-gray-500">View detailed {platform} analytics</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
