'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useHashtagAnalytics } from '@/lib/hooks/useAnalytics';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function HashtagsContent() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const { data, isLoading } = useHashtagAnalytics(startDate, endDate);
  const hashtags = data?.data ?? data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/analytics" className="text-sm text-brand-primary hover:underline">
          &larr; Analytics
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">Hashtag Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track hashtag performance and discover trends.
        </p>
      </div>

      {/* Date range filter */}
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

      {/* Hashtags table */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Top Performing Hashtags</h2>
        {isLoading ? (
          <div className="mt-4">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : hashtags.length > 0 ? (
          <div className="mt-4 space-y-3">
            {hashtags.map((tag: Record<string, unknown>, i: number) => (
              <div
                key={(tag.hashtag as string) ?? i}
                className="flex items-center justify-between rounded-brand border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400">#{i + 1}</span>
                  <span className="font-medium text-brand-primary">
                    {tag.hashtag as string}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-500">
                  <span>{((tag.reach as number) ?? 0).toLocaleString()} reach</span>
                  <span>{((tag.posts as number) ?? 0).toLocaleString()} posts</span>
                  <span>
                    {tag.engagementRate != null
                      ? `${Number(tag.engagementRate).toFixed(1)}%`
                      : '-'}{' '}
                    engagement
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">
            No hashtag data available for this range.
          </p>
        )}
      </div>
    </div>
  );
}
