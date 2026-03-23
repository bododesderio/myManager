'use client';

import { useState } from 'react';
import { useComments, useReplyToComment, useAssignComment } from '@/lib/hooks/useComments';
import { useWorkspaceMembers } from '@/lib/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const PLATFORMS = ['all', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'] as const;

const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  instagram: 'bg-pink-100 text-pink-700',
  twitter: 'bg-sky-100 text-sky-700',
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

export function ConversationsContent() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data, isLoading } = useComments(
    platformFilter !== 'all' ? { platform: platformFilter } : {},
  );
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const replyMutation = useReplyToComment();
  const assignMutation = useAssignComment();
  const { addToast } = useToast();

  const comments: any[] = (data as any)?.comments || (data as any) || [];
  const members: any[] = (membersData as any)?.members || (membersData as any) || [];

  function handleReply(commentId: string) {
    if (!replyText.trim()) return;
    replyMutation.mutate(
      { commentId, text: replyText },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Reply sent successfully.' });
          setReplyText('');
          setExpandedReply(null);
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to send reply.' });
        },
      },
    );
  }

  function handleAssign(commentId: string, userId: string) {
    assignMutation.mutate(
      { commentId, userId },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Comment assigned successfully.' });
          setAssigningId(null);
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to assign comment.' });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Conversations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and reply to incoming comments across all platforms.
          </p>
        </div>
        <div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : comments.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-gray-900">No comments yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Incoming comments from your connected platforms will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <div className="divide-y">
            {comments.map((comment: any) => {
              const platform = comment.platform || 'unknown';
              const badgeClass = PLATFORM_ICONS[platform] || 'bg-gray-100 text-gray-600';
              const isExpanded = expandedReply === comment.id;
              const isAssigning = assigningId === comment.id;

              return (
                <div key={comment.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {comment.authorName || comment.author_name || 'Unknown'}
                        </p>
                        <span
                          className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${badgeClass}`}
                        >
                          {platform}
                        </span>
                        {(comment.createdAt || comment.created_at) && (
                          <span className="text-xs text-gray-400">
                            {formatRelativeDate(comment.createdAt || comment.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {comment.text || comment.content || comment.body || ''}
                      </p>
                      {(comment.postTitle || comment.post_title) && (
                        <p className="mt-1 text-xs text-gray-400">
                          on: {comment.postTitle || comment.post_title}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-shrink-0 gap-2">
                      <button
                        onClick={() => {
                          setExpandedReply(isExpanded ? null : comment.id);
                          setReplyText('');
                        }}
                        className="rounded-brand border px-3 py-1 text-sm transition hover:border-brand-primary"
                      >
                        Reply
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setAssigningId(isAssigning ? null : comment.id)}
                          className="rounded-brand border px-3 py-1 text-sm transition hover:border-brand-primary"
                        >
                          Assign
                        </button>
                        {isAssigning && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-brand border bg-white py-1 shadow-lg">
                            {members.length === 0 ? (
                              <p className="px-3 py-2 text-sm text-gray-400">No members found</p>
                            ) : (
                              members.map((member: any) => (
                                <button
                                  key={member.id || member.userId || member.user_id}
                                  onClick={() =>
                                    handleAssign(
                                      comment.id,
                                      member.userId || member.user_id || member.id,
                                    )
                                  }
                                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  {member.name || member.email || 'Member'}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleReply(comment.id);
                        }}
                        placeholder="Type a reply..."
                        className="flex-1 rounded-brand border border-gray-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={replyMutation.isPending || !replyText.trim()}
                        className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                      >
                        {replyMutation.isPending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
