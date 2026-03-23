'use client';

import Link from 'next/link';
import { useCampaign } from '@/lib/hooks/useCampaigns';
import { usePosts } from '@/lib/hooks/usePosts';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
};

const PLATFORM_BADGES: Record<string, string> = {
  twitter: 'bg-sky-100 text-sky-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-blue-100 text-blue-800',
  tiktok: 'bg-gray-100 text-gray-800',
  youtube: 'bg-red-100 text-red-700',
};

export function CampaignDetailContent({ id }: { id: string }) {
  const { data: campaignData, isLoading: campaignLoading } = useCampaign(id);
  const { data: postsData, isLoading: postsLoading } = usePosts({ campaignId: id });

  const campaign: any = campaignData || {};
  const posts: any[] = (postsData as any)?.posts || (postsData as any) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns" className="text-sm text-brand-primary hover:underline">
          &larr; Campaigns
        </Link>
      </div>

      {/* Campaign header */}
      {campaignLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-64 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold">
                {campaign.name || `Campaign #${id}`}
              </h1>
              {campaign.status && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}`}
                >
                  {campaign.status}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {campaign.startDate || campaign.start_date
                ? `${campaign.startDate || campaign.start_date} — ${campaign.endDate || campaign.end_date}`
                : 'View and manage campaign posts and analytics.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary">
              Edit Campaign
            </button>
            <Link
              href={`/compose?campaignId=${id}`}
              className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Add Post
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      {campaignLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="mt-1 text-2xl font-bold">{posts.length}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Engagement</p>
            <p className="mt-1 text-2xl font-bold">{campaign.totalEngagement ?? '—'}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Avg. Engagement Rate</p>
            <p className="mt-1 text-2xl font-bold">{campaign.avgEngagementRate ?? '—'}</p>
          </div>
        </div>
      )}

      {/* Posts table */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Campaign Posts</h2>

        {postsLoading ? (
          <div className="mt-4">
            <TableSkeleton rows={4} cols={3} />
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No posts in this campaign yet.</p>
        ) : (
          <div className="mt-4 divide-y">
            {posts.map((post: any) => {
              const caption = post.caption || post.title || 'Untitled post';
              const platforms: string[] = post.platforms || [];
              return (
                <div key={post.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {caption.length > 80 ? caption.slice(0, 80) + '...' : caption}
                    </p>
                    {platforms.length > 0 && (
                      <div className="mt-1 flex gap-1">
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
                  </div>
                  <span
                    className={`ml-4 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[post.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {post.status || 'draft'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
