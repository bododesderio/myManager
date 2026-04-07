'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminOverrides, useCreateOverride } from '@/lib/hooks/useAdmin';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

export function OverridesContent() {
  const { data, isLoading } = useAdminOverrides();
  const createOverride = useCreateOverride();
  const { toast } = useToast();

  const overrides = data?.overrides ?? data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    workspaceId: '',
    type: 'discount',
    details: '',
    expiresAt: '',
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createOverride.mutate(
      {
        workspaceId: form.workspaceId,
        type: form.type,
        details: form.details,
        expiresAt: form.expiresAt || null,
      },
      {
        onSuccess: () => {
          toast({ title: 'Override created', variant: 'success' });
          setShowForm(false);
          setForm({ workspaceId: '', type: 'discount', details: '', expiresAt: '' });
        },
        onError: () => toast({ title: 'Failed to create override', variant: 'error' }),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/billing" className="text-sm text-brand-primary hover:underline">
          &larr; Billing
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Billing Overrides</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-brand bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          {showForm ? 'Cancel' : 'Add Override'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-brand border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-lg font-semibold">New Override</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700">
                Workspace ID
              </label>
              <input
                id="workspaceId"
                type="text"
                required
                value={form.workspaceId}
                onChange={(e) => setForm((p) => ({ ...p, workspaceId: e.target.value }))}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="overrideType" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="overrideType"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              >
                <option value="discount">Discount</option>
                <option value="free_trial">Free Trial Extension</option>
                <option value="plan_override">Plan Override</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                Details
              </label>
              <input
                id="details"
                type="text"
                required
                value={form.details}
                onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                Expires
              </label>
              <input
                id="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-4 py-2 focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createOverride.isPending}
            className="rounded-brand bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
          >
            {createOverride.isPending ? 'Creating...' : 'Create Override'}
          </button>
        </form>
      )}

      {isLoading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : (
        <div className="rounded-brand border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Workspace</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Details</th>
                <th className="px-6 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {overrides.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No overrides found.
                  </td>
                </tr>
              ) : (
                overrides.map(
                  (o: { id: string; workspaceName: string; type: string; details: string; expiresAt: string }) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{o.workspaceName}</td>
                      <td className="px-6 py-4 text-sm">{o.type}</td>
                      <td className="px-6 py-4 text-sm">{o.details}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : 'Never'}
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
