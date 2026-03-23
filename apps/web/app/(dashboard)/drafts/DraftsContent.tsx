'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePosts, useDeletePost } from '@/lib/hooks/usePosts';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const PLATFORM_BADGES: Record<string, string> = {
  twitter: 'bg-sky-100 text-sky-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-blue-100 text-blue-800',
  tiktok: 'bg-gray-100 text-gray-800',
  youtube: 'bg-red-100 text-red-700',
};

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function DraftsContent() {
  const { data, isLoading } = usePosts({ status: 'draft' });
  const deletePost = useDeletePost();
  const { addToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const drafts = (data as any)?.posts || (data as any) || [];

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deletePost.mutate(deletingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Draft deleted successfully.' });
        setDeletingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete draft.' });
        setDeletingId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Drafts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your saved draft posts.</p>
        </div>
        <Link
          href="/compose"
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          New Draft
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : drafts.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">No drafts yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start creating content and save drafts along the way.</p>
          <Link
            href="/compose"
            className="mt-4 inline-block rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Create Your First Draft
          </Link>
        </div>
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <div className="divide-y">
            {drafts.map((draft: any) => {
              const caption = draft.caption || draft.title || 'Untitled draft';
              const platforms: string[] = draft.platforms || [];
              const updatedAt = draft.updatedAt || draft.updated_at || draft.createdAt || draft.created_at || '';

              return (
                <div
                  key={draft.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {caption.length > 80 ? caption.slice(0, 80) + '...' : caption}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      {platforms.length > 0 && (
                        <div className="flex gap-1">
                          {platforms.map((p: string) => (
                            <span
                              key={p}
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${PLATFORM_BADGES[p] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      {updatedAt && (
                        <span className="text-sm text-gray-500">
                          Last edited {formatRelativeDate(updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 gap-2">
                    <Link
                      href={`/compose?postId=${draft.id}`}
                      className="rounded-brand border px-3 py-1 text-sm transition hover:border-brand-primary"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="rounded-brand border px-3 py-1 text-sm text-red-500 transition hover:border-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Delete Draft</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this draft? This action cannot be undone.
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
                disabled={deletePost.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletePost.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
