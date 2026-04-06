'use client';

import { useState } from 'react';
import {
  usePendingApprovals,
  useApprovePost,
  useRejectPost,
  useRequestRevision,
} from '@/lib/hooks/useApprovals';
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

export function ApprovalsContent() {
  const { data, isLoading, isError, error, refetch } = usePendingApprovals();
  const approvePost = useApprovePost();
  const rejectPost = useRejectPost();
  const requestRevision = useRequestRevision();
  const { addToast } = useToast();

  const approvals: any[] = (data as any)?.posts || (data as any)?.approvals || (data as any) || [];

  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentAction, setCommentAction] = useState<'reject' | 'revision' | null>(null);
  const [comment, setComment] = useState('');

  function handleApprove(postId: string) {
    approvePost.mutate(
      { postId },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Post approved successfully.' }),
        onError: () => addToast({ type: 'error', message: 'Failed to approve post.' }),
      },
    );
  }

  function openCommentModal(postId: string, action: 'reject' | 'revision') {
    setCommentPostId(postId);
    setCommentAction(action);
    setComment('');
  }

  function submitComment() {
    if (!commentPostId || !commentAction || !comment.trim()) return;

    const mutationFn = commentAction === 'reject' ? rejectPost : requestRevision;
    mutationFn.mutate(
      { postId: commentPostId, comment: comment.trim() },
      {
        onSuccess: () => {
          addToast({
            type: 'success',
            message: commentAction === 'reject' ? 'Post rejected.' : 'Revision requested.',
          });
          setCommentPostId(null);
          setCommentAction(null);
          setComment('');
        },
        onError: () => {
          addToast({ type: 'error', message: 'Action failed. Please try again.' });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">Review and approve content before publishing.</p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : isError ? (
        <div className="rounded-brand border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load pending approvals. {(error as Error)?.message ?? ''}{' '}
          <button type="button" onClick={() => refetch()} className="ml-1 underline">
            Retry
          </button>
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">All caught up!</h3>
          <p className="mt-1 text-sm text-gray-500">No posts pending approval right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item: any) => {
            const postId = item.id || item.postId || item.post_id;
            const caption =
              item.caption || item.title || item.content || 'Untitled post';
            const author =
              item.authorName || item.author_name || item.author?.name || 'Unknown';
            const platforms: string[] = item.platforms || [];
            const submittedAt =
              item.submittedAt || item.submitted_at || item.createdAt || item.created_at || '';

            return (
              <div key={postId} className="rounded-brand border bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {caption.length > 120 ? caption.slice(0, 120) + '...' : caption}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted by {author}
                      {submittedAt ? ` \u00b7 ${formatRelativeDate(submittedAt)}` : ''}
                    </p>
                    {platforms.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {platforms.map((p: string) => (
                          <span
                            key={p}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLATFORM_BADGES[p] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      aria-label={`Approve post by ${author}`}
                      onClick={() => handleApprove(postId)}
                      disabled={approvePost.isPending}
                      className="rounded-brand bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      aria-label={`Request revision on post by ${author}`}
                      onClick={() => openCommentModal(postId, 'revision')}
                      className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
                    >
                      Request Revision
                    </button>
                    <button
                      type="button"
                      aria-label={`Reject post by ${author}`}
                      onClick={() => openCommentModal(postId, 'reject')}
                      className="rounded-brand border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment modal for rejection / revision */}
      {commentPostId && commentAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setCommentPostId(null);
            setCommentAction(null);
            setComment('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setCommentPostId(null);
              setCommentAction(null);
              setComment('');
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-brand bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="approval-modal-title" className="font-heading text-lg font-semibold">
              {commentAction === 'reject' ? 'Reject Post' : 'Request Revision'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {commentAction === 'reject'
                ? 'Provide a reason for rejecting this post.'
                : 'Describe what changes are needed.'}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Add your comment..."
              className="mt-4 block w-full rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setCommentPostId(null);
                  setCommentAction(null);
                  setComment('');
                }}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={
                  !comment.trim() || rejectPost.isPending || requestRevision.isPending
                }
                className={`rounded-brand px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  commentAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-primary hover:bg-brand-primary-dark'
                }`}
              >
                {rejectPost.isPending || requestRevision.isPending
                  ? 'Submitting...'
                  : commentAction === 'reject'
                    ? 'Reject'
                    : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
