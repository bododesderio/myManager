'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useAdminPlans } from '@/lib/hooks/useAdmin';
import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';

export function PlansContent() {
  const { data, isLoading } = useAdminPlans();
  const plans = data?.plans ?? data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Plans</h1>
        <Link
          href="/superadmin/plans/new"
          className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Create Plan
        </Link>
      </div>

      {isLoading ? (
        <StatCardSkeletonGrid count={3} />
      ) : plans.length === 0 ? (
        <p className="text-sm text-text-2">No plans configured yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map(
            (plan: { id: string; name: string; monthlyPrice: number; subscriberCount?: number }) => (
              <Link
                key={plan.id}
                href={`/admin/plans/${plan.id}` as Route}
                className="rounded-brand border border-border bg-bg p-5 shadow-sm transition hover:border-primary"
              >
                <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold">
                  {plan.monthlyPrice != null ? `$${plan.monthlyPrice}/mo` : 'Custom'}
                </p>
                <p className="mt-2 text-sm text-text-2">
                  {plan.subscriberCount ?? 0} active subscribers
                </p>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}
