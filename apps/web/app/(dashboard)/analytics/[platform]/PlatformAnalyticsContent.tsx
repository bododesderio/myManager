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
import { usePlatformAnalytics } from '@/lib/hooks/useAnalytics';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
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

interface PlatformAnalyticsContentProps {
  platform: string;
}

export function PlatformAnalyticsContent({ platform }: PlatformAnalyticsContentProps) {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const name = platform.charAt(0).toUpperCase() + platform.slice(1);
  const { data, isLoading } = usePlatformAnalytics(platform, startDate, endDate);

  const analytics = data?.data ?? data;
  const metrics = analytics?.metrics;
  const dailyData = analytics?.daily ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/analytics" className="text-sm text-brand-primary hover:underline">
          &larr; Analytics
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">{name} Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed performance metrics for your {name} accounts.
        </p>
      </div>

      {/* Date range picker */}
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
      </div>

      {/* Metric cards */}
      {isLoading ? (
        <StatCardSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Followers', value: metrics?.followers ?? '-' },
            { label: 'Impressions', value: metrics?.impressions ?? '-' },
            { label: 'Engagements', value: metrics?.engagements ?? '-' },
            {
              label: 'Engagement Rate',
              value: metrics?.engagementRate != null ? `${metrics.engagementRate}%` : '-',
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

      {/* Daily chart */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">{name} Engagement Over Time</h2>
        {isLoading ? (
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
          <p className="mt-4 text-sm text-gray-400">
            No daily data available for this range.
          </p>
        )}
      </div>

      {/* Top posts section */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Top Posts</h2>
        {isLoading ? (
          <div className="mt-4">
            <CardSkeleton />
          </div>
        ) : analytics?.topPosts?.length > 0 ? (
          <div className="mt-4 space-y-3">
            {analytics.topPosts.map((post: Record<string, unknown>, i: number) => (
              <div key={(post.id as string) ?? i} className="flex items-center justify-between rounded-brand border px-4 py-3">
                <span className="text-sm font-medium">
                  {(post.caption as string)?.slice(0, 80) ?? `Post #${post.id}`}
                </span>
                <span className="text-sm text-gray-500">
                  {(post.engagements as number)?.toLocaleString()} engagements
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Your best-performing {name} posts will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
