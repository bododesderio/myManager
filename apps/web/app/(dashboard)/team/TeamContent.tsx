'use client';

import { useState } from 'react';
import {
  useWorkspaceMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/lib/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;

export function TeamContent() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data, isLoading } = useWorkspaceMembers(workspaceId);
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { addToast } = useToast();

  const members: any[] = (data as any)?.members || (data as any) || [];

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: `Invitation sent to ${inviteEmail}.` });
          setInviteEmail('');
          setInviteRole('editor');
          setShowInviteForm(false);
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to send invitation.' });
        },
      },
    );
  }

  function handleRoleChange(memberId: string, role: string) {
    updateRole.mutate(
      { memberId, role },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Role updated successfully.' });
        },
        onError: () => {
          addToast({ type: 'error', message: 'Failed to update role.' });
        },
      },
    );
  }

  function confirmRemove() {
    if (!removingId) return;
    removeMember.mutate(removingId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Member removed successfully.' });
        setRemovingId(null);
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to remove member.' });
        setRemovingId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-gray-500">Manage team members and their roles.</p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Invite Member
        </button>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Invite a Team Member</h2>
          <form onSubmit={handleInvite} className="mt-4 flex flex-wrap items-end gap-4">
            <div className="flex-1">
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 block rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviteMember.isPending}
                className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
              >
                {inviteMember.isPending ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : members.length === 0 ? (
        <div className="rounded-brand border bg-white py-16 text-center shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-gray-900">No team members</h3>
          <p className="mt-1 text-sm text-gray-500">Invite someone to get started.</p>
        </div>
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member: any) => {
                const memberId = member.id || member.userId || member.user_id;
                const isOwner = (member.role || '').toLowerCase() === 'owner';

                return (
                  <tr key={memberId || member.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{member.name || member.email}</p>
                      {member.name && (
                        <p className="text-sm text-gray-500">{member.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isOwner ? (
                        <span className="text-sm font-medium capitalize">{member.role}</span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(memberId, e.target.value)}
                          className="rounded-brand border border-gray-300 px-2 py-1 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        >
                          {ROLES.filter((r) => r !== 'owner').map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {member.joinedAt || member.joined_at || member.createdAt || member.created_at || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {!isOwner && (
                        <button
                          onClick={() => setRemovingId(memberId)}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove confirmation modal */}
      {removingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-brand bg-white p-6 shadow-lg">
            <h3 className="font-heading text-lg font-semibold">Remove Member</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to remove this member from the workspace?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRemovingId(null)}
                className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removeMember.isPending}
                className="rounded-brand bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {removeMember.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
