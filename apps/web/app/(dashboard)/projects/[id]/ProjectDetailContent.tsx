'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProject, useProjectMembers } from '@/lib/hooks/useProjects';
import { usePosts } from '@/lib/hooks/usePosts';
import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

type Tab = 'overview' | 'members' | 'posts';

export function ProjectDetailContent({ id }: { id: string }) {
  const { data: projectData, isLoading: projectLoading } = useProject(id);
  const { data: membersData, isLoading: membersLoading } = useProjectMembers(id);
  const { data: postsData, isLoading: postsLoading } = usePosts({ projectId: id });
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const project: any = projectData || {};
  const members: any[] = (membersData as any)?.members || (membersData as any) || [];
  const posts: any[] = (postsData as any)?.posts || (postsData as any) || [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members' },
    { key: 'posts', label: 'Posts' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="text-sm text-brand-primary hover:underline">
          &larr; Projects
        </Link>
      </div>

      {/* Header */}
      {projectLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-64 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {project.name || `Project #${id}`}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/projects/${id}/analytics`}
              className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
            >
              Analytics
            </Link>
            <Link
              href={`/projects/${id}/settings`}
              className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
            >
              Settings
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      {projectLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Connected Accounts</p>
            <p className="mt-1 text-2xl font-bold">{project.accountCount ?? project.accounts ?? 0}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Team Members</p>
            <p className="mt-1 text-2xl font-bold">{members.length}</p>
          </div>
          <div className="rounded-brand border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Posts</p>
            <p className="mt-1 text-2xl font-bold">{posts.length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-b-2 border-brand-primary text-brand-primary'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
          {postsLoading ? (
            <div className="mt-4">
              <TableSkeleton rows={3} cols={2} />
            </div>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No recent activity for this project.</p>
          ) : (
            <div className="mt-4 divide-y">
              {posts.slice(0, 5).map((post: any) => (
                <div key={post.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {(post.caption || post.title || 'Untitled').slice(0, 60)}
                    </p>
                    <p className="text-sm text-gray-500">{post.status || 'draft'}</p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {post.createdAt || post.created_at || ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="rounded-brand border bg-white shadow-sm">
          {membersLoading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No members found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map((member: any) => (
                  <tr key={member.id || member.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{member.name || member.email}</p>
                      {member.name && <p className="text-sm text-gray-500">{member.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{member.role || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {member.joinedAt || member.joined_at || member.createdAt || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="rounded-brand border bg-white shadow-sm">
          {postsLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No posts for this project.</div>
          ) : (
            <div className="divide-y">
              {posts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {(post.caption || post.title || 'Untitled').slice(0, 80)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{post.status || 'draft'}</p>
                  </div>
                  <Link
                    href={`/compose?postId=${post.id}`}
                    className="ml-4 rounded-brand border px-3 py-1 text-sm transition hover:border-brand-primary"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
