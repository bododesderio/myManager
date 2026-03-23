'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAnalyticsOverview } from '@/lib/hooks/useAnalytics';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export function ProjectAnalyticsContent({ id }: { id: string }) {
  const defaults = useMemo(() => getDefaultDates(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const { data, isLoading } = useAnalyticsOverview(startDate, endDate);
  const overview: any = data || {};

  const metrics = [
    { label: 'Total Reach', value: overview.totalReach ?? overview.reach ?? '—' },
    { label: 'Engagements', value: overview.totalEngagements ?? overview.engagements ?? '—' },
    { label: 'Followers Gained', value: overview.followersGained ?? overview.followers_gained ?? '—' },
    { label: 'Posts Published', value: overview.postsPublished ?? overview.posts_published ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`} className="text-sm text-brand-primary hover:underline">
          &larr; Project #{id}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Project Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Performance overview for this project.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <StatCardSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-brand border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Performance Over Time</h2>
        {isLoading ? (
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-primary" />
          </div>
        ) : (
          <div className="mt-4 flex h-64 items-center justify-center text-sm text-gray-400">
            Project-specific analytics charts will render here.
          </div>
        )}
      </div>
    </div>
  );
}
