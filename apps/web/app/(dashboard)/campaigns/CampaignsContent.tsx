'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCampaigns, useDeleteCampaign } from '@/lib/hooks/useCampaigns';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
};

export function CampaignsContent() {
  const router = useRouter();
  const { data, isLoading } = useCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const { addToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const campaigns: any[] = (data as any)?.campaigns || (data as any) || [];

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteCampaign.mutate(deletingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Campaign deleted successfully.' });
        setDeletingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete campaign.' });
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">Organize posts into campaigns for better tracking.</p>
        </div>
        <Link
          href="/compose?type=campaign"
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          New Campaign
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : campaigns.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">No campaigns yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first campaign to organize your posts.</p>
        </div>
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Campaign</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Posts</th>
                <th className="px-6 py-3 font-medium">Date Range</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((campaign: any) => (
                <tr
                  key={campaign.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-brand-primary">{campaign.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{campaign.postCount ?? campaign.posts ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {campaign.startDate || campaign.start_date || '—'} &mdash;{' '}
                    {campaign.endDate || campaign.end_date || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(campaign.id);
                      }}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Delete Campaign</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteCampaign.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteCampaign.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
