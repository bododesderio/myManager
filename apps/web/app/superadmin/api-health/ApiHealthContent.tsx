'use client';

import { useAdminHealth } from '@/lib/hooks/useAdmin';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const statusStyles: Record<string, string> = {
  operational: 'bg-green-100 text-green-800',
  healthy: 'bg-green-100 text-green-800',
  degraded: 'bg-yellow-100 text-yellow-800',
  down: 'bg-red-100 text-red-800',
  unhealthy: 'bg-red-100 text-red-800',
};

export function ApiHealthContent() {
  const { data: health, isLoading, dataUpdatedAt } = useAdminHealth();

  const services: { name: string; status: string; latency: string; lastCheck: string }[] =
    health?.services ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">API Health Monitor</h1>
        {dataUpdatedAt > 0 && (
          <span className="text-xs text-gray-400">
            Updated {new Date(dataUpdatedAt).toLocaleTimeString()} (auto-refreshes every 30s)
          </span>
        )}
      </div>

      {health?.uptime != null && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Uptime</p>
            <p className="mt-1 text-2xl font-bold">{health.uptime}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Response Time</p>
            <p className="mt-1 text-2xl font-bold">{health.responseTime ?? '--'}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1 text-2xl font-bold">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  statusStyles[health.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {health.status}
              </span>
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Service / Platform API</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Latency</th>
                <th className="px-6 py-3 font-medium">Last Check</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No service data available.
                  </td>
                </tr>
              ) : (
                services.map((svc) => (
                  <tr key={svc.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{svc.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusStyles[svc.status] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{svc.latency}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{svc.lastCheck}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
