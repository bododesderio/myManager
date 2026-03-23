'use client';

import { useAdminWorkspaces } from '@/lib/hooks/useAdmin';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

export function WorkspacesContent() {
  const { data, isLoading } = useAdminWorkspaces();
  const workspaces = data?.workspaces ?? data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Workspaces</h1>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Workspace</th>
                <th className="px-6 py-3 font-medium">Owner</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Posts</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {workspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No workspaces found.
                  </td>
                </tr>
              ) : (
                workspaces.map(
                  (ws: {
                    id: string;
                    name: string;
                    ownerEmail: string;
                    plan: string;
                    memberCount: number;
                    postCount: number;
                    createdAt: string;
                  }) => (
                    <tr key={ws.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{ws.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{ws.ownerEmail}</td>
                      <td className="px-6 py-4 text-sm">{ws.plan}</td>
                      <td className="px-6 py-4 text-sm">{ws.memberCount}</td>
                      <td className="px-6 py-4 text-sm">{ws.postCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ws.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
