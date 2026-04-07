'use client';

import Link from 'next/link';
import { useAdminUser, useDisableUserTwoFactor, useSuspendUser, useUpdateUserRole } from '@/lib/hooks/useAdmin';
import { useToast } from '@/providers/ToastProvider';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';

export function UserDetailContent({ id }: { id: string }) {
  const { data: user, isLoading } = useAdminUser(id);
  const suspendUser = useSuspendUser();
  const updateRole = useUpdateUserRole();
  const disableUserTwoFactor = useDisableUserTwoFactor();
  const { toast } = useToast();

  function handleSuspend() {
    if (!user) return;
    suspendUser.mutate(
      { id, suspended: !user.suspended },
      {
        onSuccess: () =>
          toast({ title: user.suspended ? 'User unsuspended' : 'User suspended', variant: 'success' }),
        onError: () => toast({ title: 'Action failed', variant: 'error' }),
      },
    );
  }

  function handleToggleSuperadmin() {
    if (!user) return;
    updateRole.mutate(
      { id, is_superadmin: !user.is_superadmin },
      {
        onSuccess: () =>
          toast({
            title: user.is_superadmin ? 'Superadmin removed' : 'Superadmin granted',
            variant: 'success',
          }),
        onError: () => toast({ title: 'Action failed', variant: 'error' }),
      },
    );
  }

  function handleDisableTwoFactor() {
    if (!user?.twoFactorEnabled) return;
    disableUserTwoFactor.mutate(
      { id },
      {
        onSuccess: () => toast({ title: '2FA disabled for this user', variant: 'success' }),
        onError: () => toast({ title: 'Unable to disable 2FA', variant: 'error' }),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <StatCardSkeletonGrid count={4} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/superadmin/users" className="text-sm text-brand-primary hover:underline">&larr; Users</Link>
        <p className="text-gray-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/users" className="text-sm text-brand-primary hover:underline">&larr; Users</Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{user.name ?? `User #${id}`}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDisableTwoFactor}
            disabled={disableUserTwoFactor.isPending || !user.twoFactorEnabled}
            className="rounded-brand border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disableUserTwoFactor.isPending ? 'Disabling 2FA...' : 'Disable User 2FA'}
          </button>
          <button
            onClick={handleToggleSuperadmin}
            disabled={updateRole.isPending}
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary disabled:opacity-50"
          >
            {user.is_superadmin ? 'Remove Superadmin' : 'Make Superadmin'}
          </button>
          <button
            onClick={handleSuspend}
            disabled={suspendUser.isPending}
            className="rounded-brand border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {user.suspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Profile</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs text-gray-500">Name</dt>
              <dd className="font-medium">{user.name ?? '--'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Plan</dt>
              <dd className="font-medium">{user.plan ?? '--'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Status</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {user.suspended ? 'Suspended' : 'Active'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Role</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.is_superadmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.is_superadmin ? 'Superadmin' : 'User'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Two-Factor Authentication</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.twoFactorEnabled ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Joined</dt>
              <dd className="font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '--'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Usage</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs text-gray-500">Social Accounts</dt>
              <dd className="font-medium">
                {user.usage?.socialAccounts ?? 0} / {user.limits?.socialAccounts ?? '--'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Posts This Month</dt>
              <dd className="font-medium">{user.usage?.postsThisMonth ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Storage Used</dt>
              <dd className="font-medium">
                {user.usage?.storageUsedGb ?? 0} GB / {user.limits?.storageGb ?? '--'} GB
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Team Members</dt>
              <dd className="font-medium">{user.usage?.teamMembers ?? 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      {user.workspaces?.length > 0 && (
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Workspaces</h2>
          <div className="mt-4 divide-y">
            {user.workspaces.map((ws: { id: string; name: string; role: string }) => (
              <div key={ws.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{ws.name}</span>
                <span className="text-sm text-gray-500">{ws.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
