'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReports, useGenerateReport, useDeleteReport } from '@/lib/hooks/useReports';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Card } from '@mymanager/ui';

const REPORT_PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ReportsContent() {
  const { data, isLoading } = useReports();
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();
  const { addToast } = useToast();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pdf' as 'pdf' | 'csv',
    dateFrom: '',
    dateTo: '',
    platforms: [] as string[],
  });

  const reports: any[] = (data as any)?.reports || (data as any) || [];

  function togglePlatform(platform: string) {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }

  const formErrors = {
    name: !formData.name.trim() ? 'Report name is required.' : '',
    dateFrom: !formData.dateFrom ? 'Start date is required.' : '',
    dateTo:
      !formData.dateTo
        ? 'End date is required.'
        : formData.dateFrom && formData.dateTo < formData.dateFrom
          ? 'End date must be after start date.'
          : '',
  };
  const isFormValid = !formErrors.name && !formErrors.dateFrom && !formErrors.dateTo;

  function handleGenerate() {
    if (!isFormValid) {
      addToast({ type: 'warning', message: 'Please fix the highlighted fields.' });
      return;
    }
    generateReport.mutate(
      {
        workspaceId,
        name: formData.name,
        type: formData.type,
        dateFrom: formData.dateFrom,
        dateTo: formData.dateTo,
        platforms: formData.platforms,
      },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Report generation started.' });
          setShowModal(false);
          setFormData({ name: '', type: 'pdf', dateFrom: '', dateTo: '', platforms: [] });
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to generate report.' });
        },
      },
    );
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteReport.mutate(deletingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Report deleted successfully.' });
        setDeletingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete report.' });
        setDeletingId(null);
      },
    });
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-bg-2 text-text-2';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reports</h1>
          <p className="mt-1 text-sm text-text-2">
            Create and manage custom analytics reports.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Generate Report
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : reports.length === 0 ? (
        <Card padding="none" className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-2">
            <svg className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-text">No reports yet</h3>
          <p className="mt-1 text-sm text-text-2">
            Generate your first analytics report to get started.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-block rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Generate Your First Report
          </button>
        </Card>
      ) : (
        <Card padding="none">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b px-6 py-3 text-xs font-semibold uppercase text-text-2">
            <div className="flex-1">Name</div>
            <div className="w-20 text-center">Type</div>
            <div className="w-28 text-center">Created</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-36 text-right">Actions</div>
          </div>
          <div className="divide-y">
            {reports.map((report: any) => {
              const type = (report.type || 'pdf').toUpperCase();
              const status = report.status || 'completed';
              const createdAt = report.createdAt || report.created_at || '';

              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-bg-2"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/reports/${report.id}`}
                      className="font-medium text-text hover:text-primary"
                    >
                      {report.name || 'Untitled Report'}
                    </Link>
                  </div>
                  <div className="w-20 text-center">
                    <span className="rounded-full bg-bg-2 px-2 py-0.5 text-xs font-medium text-text-2">
                      {type}
                    </span>
                  </div>
                  <div className="w-28 text-center text-sm text-text-2">
                    {createdAt ? formatDate(createdAt) : '-'}
                  </div>
                  <div className="w-24 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(status)}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex w-36 justify-end gap-2">
                    {status === 'completed' && report.downloadUrl && (
                      <a
                        href={report.downloadUrl || report.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-brand border border-border px-3 py-1 text-sm transition hover:border-primary"
                      >
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => setDeletingId(report.id)}
                      className="rounded-brand border border-border px-3 py-1 text-sm text-red-500 transition hover:border-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Generate Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-brand bg-bg p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Generate Report</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="reportName" className="block text-sm font-medium text-text-2">
                  Report Name *
                </label>
                <input
                  id="reportName"
                  type="text"
                  required
                  minLength={2}
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Monthly Overview"
                  className={`mt-1 block w-full rounded-brand border px-4 py-2 text-sm focus:outline-none ${
                    formErrors.name ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'
                  }`}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateFrom" className="block text-sm font-medium text-text-2">
                    Date From *
                  </label>
                  <input
                    id="dateFrom"
                    type="date"
                    required
                    value={formData.dateFrom}
                    onChange={(e) => setFormData((f) => ({ ...f, dateFrom: e.target.value }))}
                      className={`mt-1 block w-full rounded-brand border px-4 py-2 text-sm focus:outline-none ${
                      formErrors.dateFrom ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'
                    }`}
                  />
                  {formErrors.dateFrom && <p className="mt-1 text-xs text-red-600">{formErrors.dateFrom}</p>}
                </div>
                <div>
                  <label htmlFor="dateTo" className="block text-sm font-medium text-text-2">
                    Date To *
                  </label>
                  <input
                    id="dateTo"
                    type="date"
                    required
                    min={formData.dateFrom || undefined}
                    value={formData.dateTo}
                    onChange={(e) => setFormData((f) => ({ ...f, dateTo: e.target.value }))}
                      className={`mt-1 block w-full rounded-brand border px-4 py-2 text-sm focus:outline-none ${
                      formErrors.dateTo ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'
                    }`}
                  />
                  {formErrors.dateTo && <p className="mt-1 text-xs text-red-600">{formErrors.dateTo}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2">Report Type</label>
                <div className="mt-1 flex gap-3">
                  {(['pdf', 'csv'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData((f) => ({ ...f, type: t }))}
                      className={`rounded-brand border px-4 py-2 text-sm font-medium transition ${
                        formData.type === t
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'hover:border-primary'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2">Platforms</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {REPORT_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`rounded-brand border px-3 py-1 text-xs font-medium capitalize transition ${
                        formData.platforms.includes(p)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'hover:border-primary'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-brand border border-border px-4 py-2 text-sm font-medium transition hover:border-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generateReport.isPending}
                className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {generateReport.isPending ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-bg p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Delete Report</h3>
            <p className="mt-2 text-sm text-text-2">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-brand border border-border px-4 py-2 text-sm font-medium transition hover:border-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteReport.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteReport.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
