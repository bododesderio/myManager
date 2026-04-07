'use client';

import { useAdminQueue } from '@/lib/hooks/useAdmin';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import styles from './QueueContent.module.css';

export function QueueContent() {
  const { data, isLoading, dataUpdatedAt } = useAdminQueue();

  const queues: { name: string; waiting: number; active: number; completed: number; failed: number }[] =
    data?.queues ?? [];
  const jobs: { id: string; name: string; queue: string; progress: number }[] = data?.activeJobs ?? [];

  const totals = queues.reduce(
    (acc, q) => ({
      waiting: acc.waiting + q.waiting,
      active: acc.active + q.active,
      completed: acc.completed + q.completed,
      failed: acc.failed + q.failed,
    }),
    { waiting: 0, active: 0, completed: 0, failed: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Queue Monitor</h1>
        {dataUpdatedAt > 0 && (
          <span className="text-xs text-gray-400">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString()} (auto-refreshes every 10s)
          </span>
        )}
      </div>

      {isLoading ? (
        <StatCardSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Waiting</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{totals.waiting}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{totals.active}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completed (24h)</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{totals.completed.toLocaleString()}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Failed (24h)</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{totals.failed}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : queues.length > 0 ? (
        <div className="rounded-brand border bg-white shadow-sm">
          <h2 className="border-b px-6 py-4 font-heading text-lg font-semibold">Queues</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Queue</th>
                <th className="px-6 py-3 font-medium">Waiting</th>
                <th className="px-6 py-3 font-medium">Active</th>
                <th className="px-6 py-3 font-medium">Completed</th>
                <th className="px-6 py-3 font-medium">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {queues.map((q) => (
                <tr key={q.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{q.name}</td>
                  <td className="px-6 py-4 text-sm text-yellow-600">{q.waiting}</td>
                  <td className="px-6 py-4 text-sm text-blue-600">{q.active}</td>
                  <td className="px-6 py-4 text-sm text-green-600">{q.completed.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-red-600">{q.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {jobs.length > 0 && (
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Active Jobs</h2>
          <div className="mt-4 space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-brand border px-4 py-3">
                <div>
                  <span className="text-sm font-medium">{job.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{job.queue}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full bg-brand-primary ${styles.progressFill}`}
                      style={{ ['--progress' as string]: `${job.progress}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{job.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
