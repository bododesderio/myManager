'use client';

import Link from 'next/link';
import { useAdminBilling } from '@/lib/hooks/useAdmin';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

export function BillingContent() {
  const { data: billing, isLoading } = useAdminBilling();

  const stats = [
    { label: 'MRR', value: billing?.mrr != null ? `$${billing.mrr.toLocaleString()}` : '--' },
    { label: 'ARR', value: billing?.mrr != null ? `$${(billing.mrr * 12).toLocaleString()}` : '--' },
    { label: 'Active Subscriptions', value: billing?.activeSubscriptions?.toLocaleString() ?? '--' },
    {
      label: 'Avg Revenue / User',
      value:
        billing?.mrr != null && billing?.activeSubscriptions
          ? `$${(billing.mrr / billing.activeSubscriptions).toFixed(2)}`
          : '--',
    },
  ];

  const planBreakdown: { plan: string; count: number; revenue: number }[] =
    billing?.subscriptionsByPlan ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Billing Management</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/billing/overrides"
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
          >
            Overrides
          </Link>
          <Link
            href="/admin/billing/leads"
            className="rounded-brand border px-4 py-2 text-sm font-medium transition hover:border-brand-primary"
          >
            Leads
          </Link>
        </div>
      </div>

      {isLoading ? (
        <StatCardSkeletonGrid count={4} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-brand border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {planBreakdown.length > 0 && (
        <div className="rounded-brand border bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold">Subscriptions by Plan</h2>
          <div className="mt-4 space-y-3">
            {planBreakdown.map((item) => (
              <div key={item.plan} className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.plan}</span>
                <div className="flex gap-6">
                  <span className="text-gray-500">{item.count} subs</span>
                  <span className="font-medium">${item.revenue.toLocaleString()}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Recent Transactions</h2>
        {isLoading ? (
          <div className="mt-4">
            <TableSkeleton rows={3} cols={4} />
          </div>
        ) : billing?.recentTransactions?.length ? (
          <div className="mt-4 divide-y">
            {billing.recentTransactions.map(
              (tx: { id: string; user: string; amount: number; status: string; date: string }) => (
                <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{tx.user}</span>
                  <span>${tx.amount.toFixed(2)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tx.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tx.status}
                  </span>
                  <span className="text-gray-500">{new Date(tx.date).toLocaleDateString()}</span>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Payment transactions and invoices will appear here.</p>
        )}
      </div>
    </div>
  );
}
