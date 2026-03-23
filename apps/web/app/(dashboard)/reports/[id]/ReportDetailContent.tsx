'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReport } from '@/lib/hooks/useReports';
import { useToast } from '@/providers/ToastProvider';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ReportDetailContent({ id }: { id: string }) {
  const { data, isLoading } = useReport(id);
  const { addToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);

  const report: any = (data as any)?.report || data || null;

  function handleCopyShareLink() {
    const url = `${window.location.origin}/reports/${id}`;
    navigator.clipboard.writeText(url).then(
      () => addToast({ type: 'success', message: 'Share link copied to clipboard.' }),
      () => addToast({ type: 'error', message: 'Failed to copy link.' }),
    );
    setShowShareModal(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-sm text-brand-primary hover:underline">
            &larr; Reports
          </Link>
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-sm text-brand-primary hover:underline">
            &larr; Reports
          </Link>
        </div>
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-gray-900">Report not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            This report may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const reportType = (report.type || 'pdf').toLowerCase();
  const isPdf = reportType === 'pdf';
  const downloadUrl = report.downloadUrl || report.download_url;
  const dateFrom = report.dateFrom || report.date_from || '';
  const dateTo = report.dateTo || report.date_to || '';
  const createdAt = report.createdAt || report.created_at || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/reports" className="text-sm text-brand-primary hover:underline">
          &larr; Reports
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{report.name || `Report #${id}`}</h1>
        <div className="flex gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
            >
              Download {reportType.toUpperCase()}
            </a>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Share
          </button>
        </div>
      </div>

      {/* Report metadata */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Report Details</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Type</p>
            <p className="mt-1 text-sm font-medium">{reportType.toUpperCase()}</p>
          </div>
          {dateFrom && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Date From</p>
              <p className="mt-1 text-sm font-medium">{formatDate(dateFrom)}</p>
            </div>
          )}
          {dateTo && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Date To</p>
              <p className="mt-1 text-sm font-medium">{formatDate(dateTo)}</p>
            </div>
          )}
          {createdAt && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Generated</p>
              <p className="mt-1 text-sm font-medium">{formatDate(createdAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Report preview */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Preview</h2>
        <div className="mt-4">
          {isPdf && downloadUrl ? (
            <iframe
              src={downloadUrl}
              title="Report PDF Preview"
              className="h-[600px] w-full rounded-brand border"
            />
          ) : isPdf ? (
            <div className="rounded-brand border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
              PDF preview is not available. Download the file to view it.
            </div>
          ) : (
            <div className="rounded-brand border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
              CSV reports cannot be previewed. Please download the file to view the data.
            </div>
          )}
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Share Report</h3>
            <p className="mt-2 text-sm text-gray-500">
              Copy the link below to share this report with others.
            </p>
            <div className="mt-4">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reports/${id}`}
                className="block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyShareLink}
                className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
