'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePost, usePostAnalytics, useDeletePost, useDuplicatePost } from '@/lib/hooks/usePosts';
import { useToast } from '@/providers/ToastProvider';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';

interface PostDetailContentProps {
  id: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function PostDetailContent({ id }: PostDetailContentProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const { data: postData, isLoading: postLoading } = usePost(id);
  const { data: analyticsData, isLoading: analyticsLoading } = usePostAnalytics(id);
  const deletePost = useDeletePost();
  const duplicatePost = useDuplicatePost();

  const post = postData?.data ?? postData;
  const analytics = analyticsData?.data ?? analyticsData;
  const isPublished = post?.status === 'published';

  function handleEdit() {
    router.push(`/posts/${id}/edit` as Route);
  }

  function handleDelete() {
    if (!confirm('Are you sure you want to delete this post?')) return;
    deletePost.mutate(id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Post deleted successfully.' });
        router.push('/home');
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to delete post.' });
      },
    });
  }

  function handleDuplicate() {
    duplicatePost.mutate(id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Post duplicated successfully.' });
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to duplicate post.' });
      },
    });
  }

  if (postLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <div className="space-y-4">
            <StatCardSkeletonGrid count={4} />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <Link href="/home" className="text-sm text-brand-primary hover:underline">
          &larr; Dashboard
        </Link>
        <p className="text-gray-500">Post not found.</p>
      </div>
    );
  }

  const platforms: string[] = post.platforms ?? [];
  const platformResults: Record<string, unknown>[] = post.platformResults ?? [];
  const status = (post.status as string) ?? 'draft';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/home" className="text-sm text-brand-primary hover:underline">
          &larr; Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold">Post #{id}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusColors[status] ?? statusColors.draft
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
          >
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            disabled={duplicatePost.isPending}
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary disabled:opacity-50"
          >
            {duplicatePost.isPending ? 'Duplicating...' : 'Duplicate'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deletePost.isPending}
            className="rounded-brand border px-4 py-2 text-sm font-medium text-red-500 transition hover:border-red-500 disabled:opacity-50"
          >
            {deletePost.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Post content */}
        <div className="space-y-4">
          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Post Content</h2>
            {post.caption ? (
              <p className="mt-4 whitespace-pre-wrap text-gray-700">{post.caption}</p>
            ) : (
              <p className="mt-4 text-sm text-gray-400">No caption provided.</p>
            )}

            {/* Media */}
            {post.media?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.media.map((item: Record<string, unknown>, i: number) => (
                  <div
                    key={i}
                    className="flex h-20 w-20 items-center justify-center rounded-brand border bg-gray-50 text-xs text-gray-400"
                  >
                    {(item.type as string) ?? 'media'}
                  </div>
                ))}
              </div>
            )}

            {/* Platform tags */}
            {platforms.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-medium text-brand-primary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Per-platform publishing results */}
          {platformResults.length > 0 && (
            <div className="rounded-brand border bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold">Publishing Results</h2>
              <div className="mt-4 space-y-3">
                {platformResults.map((result, i) => (
                  <div key={i} className="flex items-center justify-between rounded-brand border px-4 py-3">
                    <span className="text-sm font-medium">{result.platform as string}</span>
                    <span
                      className={`text-xs font-medium ${
                        result.success ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {result.success ? 'Published' : (result.error as string) ?? 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analytics + comments */}
        <div className="space-y-4">
          {isPublished && (
            <div className="rounded-brand border bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold">Performance</h2>
              {analyticsLoading ? (
                <div className="mt-4">
                  <StatCardSkeletonGrid count={4} />
                </div>
              ) : analytics ? (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Impressions', value: analytics.impressions },
                    { label: 'Engagements', value: analytics.engagements },
                    { label: 'Clicks', value: analytics.clicks },
                    { label: 'Shares', value: analytics.shares },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <p className="text-xs text-gray-500">{metric.label}</p>
                      <p className="text-lg font-bold">
                        {metric.value != null
                          ? Number(metric.value).toLocaleString()
                          : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400">
                  No analytics data available yet.
                </p>
              )}
            </div>
          )}

          <div className="rounded-brand border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Comments</h2>
            {analytics?.comments?.length > 0 ? (
              <div className="mt-4 space-y-3">
                {analytics.comments.map((comment: Record<string, unknown>, i: number) => (
                  <div key={i} className="rounded-brand border px-4 py-3">
                    <p className="text-sm font-medium">{comment.author as string}</p>
                    <p className="mt-1 text-sm text-gray-600">{comment.text as string}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Comments from social platforms will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
