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
import { useEngagementRate } from '@/lib/hooks/useAnalytics';
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

export function BenchmarksContent() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const { data, isLoading } = useEngagementRate(startDate, endDate);
  const engagement = data?.data ?? data;
  const trends = engagement?.trends ?? [];
  const benchmarks = engagement?.benchmarks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/analytics" className="text-sm text-brand-primary hover:underline">
          &larr; Analytics
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">Industry Benchmarks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare your performance against industry averages.
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

      {/* Engagement rate trend chart */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Engagement Rate Trends</h2>
        {isLoading ? (
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="h-full w-full animate-pulse rounded bg-gray-100" />
          </div>
        ) : trends.length > 0 ? (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="yours"
                  name="Your Rate"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="industry"
                  name="Industry Avg"
                  stroke="#d1d5db"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">
            No engagement trend data available for this range.
          </p>
        )}
      </div>

      {/* Comparison metrics */}
      {isLoading ? (
        <StatCardSkeletonGrid count={4} />
      ) : benchmarks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {benchmarks.map((bench: Record<string, unknown>) => {
            const status = (bench.yours as number) >= (bench.industry as number) ? 'above' : 'below';
            return (
              <div key={bench.metric as string} className="rounded-brand border bg-white p-5 shadow-sm">
                <h3 className="font-heading font-semibold">{bench.metric as string}</h3>
                <div className="mt-3 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Your Performance</p>
                    <p className="text-lg font-bold">{String(bench.yours)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Industry Average</p>
                    <p className="text-lg font-bold text-gray-400">{String(bench.industry)}</p>
                  </div>
                </div>
                <p
                  className={`mt-2 text-xs font-medium ${
                    status === 'above' ? 'text-green-600' : 'text-orange-500'
                  }`}
                >
                  {status === 'above' ? 'Above average' : 'Below average'}
                </p>
              </div>
            );
          })}
        </div>
      ) : !isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { metric: 'Engagement Rate', yours: engagement?.current ?? '-', industry: engagement?.industryAvg ?? '-' },
            { metric: 'Avg. Engagement Rate', yours: engagement?.average ?? '-', industry: engagement?.industryAvg ?? '-' },
          ].map((bench) => {
            const yoursNum = typeof bench.yours === 'number' ? bench.yours : 0;
            const industryNum = typeof bench.industry === 'number' ? bench.industry : 0;
            const status = yoursNum >= industryNum ? 'above' : 'below';
            return (
              <div key={bench.metric} className="rounded-brand border bg-white p-5 shadow-sm">
                <h3 className="font-heading font-semibold">{bench.metric}</h3>
                <div className="mt-3 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Your Performance</p>
                    <p className="text-lg font-bold">
                      {typeof bench.yours === 'number' ? `${bench.yours}%` : bench.yours}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Industry Average</p>
                    <p className="text-lg font-bold text-gray-400">
                      {typeof bench.industry === 'number' ? `${bench.industry}%` : bench.industry}
                    </p>
                  </div>
                </div>
                <p
                  className={`mt-2 text-xs font-medium ${
                    status === 'above' ? 'text-green-600' : 'text-orange-500'
                  }`}
                >
                  {status === 'above' ? 'Above average' : 'Below average'}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
