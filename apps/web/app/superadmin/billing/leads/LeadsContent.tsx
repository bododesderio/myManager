'use client';

import Link from 'next/link';
import { useAdminLeads } from '@/lib/hooks/useAdmin';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { Card } from '@mymanager/ui';

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  closed: 'bg-bg-2 text-text',
};

export function LeadsContent() {
  const { data, isLoading } = useAdminLeads();
  const leads = data?.leads ?? data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/billing" className="text-sm text-primary hover:underline">
          &larr; Billing
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold">Sales Leads</h1>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-text-2">
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-text-2">
                    No leads found.
                  </td>
                </tr>
              ) : (
                leads.map(
                  (lead: {
                    id: string;
                    name: string;
                    company: string;
                    source: string;
                    status: string;
                    createdAt: string;
                  }) => (
                    <tr key={lead.id} className="hover:bg-bg-2">
                      <td className="px-6 py-4 font-medium">{lead.name}</td>
                      <td className="px-6 py-4 text-sm">{lead.company}</td>
                      <td className="px-6 py-4 text-sm text-text-2">{lead.source}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            statusStyles[lead.status.toLowerCase()] ?? 'bg-bg-2 text-text'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-2">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
