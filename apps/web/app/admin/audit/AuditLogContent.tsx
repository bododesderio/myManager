'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

interface AuditEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export function AuditLogContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [actions, setActions] = useState<string[]>([]);

  // Filters
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (userId) params.set('userId', userId);
      if (resourceType) params.set('resourceType', resourceType);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/v1/admin/audit?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load audit log');
      const json = (await res.json()) as AuditResponse;
      setData(json);
    } catch {
      toast({ title: 'Could not load audit log', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [action, userId, resourceType, fromDate, toDate, page, toast]);

  const loadActions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/audit/actions');
      if (!res.ok) return;
      const json = (await res.json()) as { actions: string[] };
      setActions(json.actions ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

  useEffect(() => {
    setLoading(true);
    void loadEntries();
  }, [loadEntries]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        void loadEntries();
      }, 10_000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, loadEntries]);

  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (userId) params.set('userId', userId);
      if (resourceType) params.set('resourceType', resourceType);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/v1/admin/audit/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'CSV exported', variant: 'success' });
    } catch {
      toast({ title: 'Export failed', variant: 'error' });
    }
  }

  const entries = data?.entries ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Audit Log</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={handleExport}
            className="rounded-brand border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-brand border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Action</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">User ID</label>
          <input
            type="text"
            placeholder="Search by user ID..."
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setPage(1);
            }}
            className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Resource Type</label>
          <input
            type="text"
            placeholder="e.g. user, post..."
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value);
              setPage(1);
            }}
            className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          />
        </div>

        <button
          onClick={() => {
            setAction('');
            setUserId('');
            setResourceType('');
            setFromDate('');
            setToDate('');
            setPage(1);
          }}
          className="rounded-brand border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Resource Type</th>
                <th className="px-6 py-3 font-medium">Resource ID</th>
                <th className="px-6 py-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">{entry.userEmail}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{entry.resourceType}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{entry.resourceId}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{entry.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-brand border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-brand border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
