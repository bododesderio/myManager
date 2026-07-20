import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { SkeletonBar } from '@/components/skeletons/CardSkeleton';

/**
 * Route-level loading state for the superadmin portal.
 *
 * Admin screens are predominantly tabular (users, plans, billing, audit log), so
 * this leads with a table rather than the card grid the dashboard uses — a
 * skeleton that does not resemble the page it precedes causes a visible jump on
 * resolve.
 */
export default function SuperadminLoading() {
  return (
    <div className="space-y-6">
      <div aria-hidden="true" className="animate-pulse space-y-2">
        <SkeletonBar className="h-6 w-56" />
        <SkeletonBar className="h-3 w-80" />
      </div>

      <StatCardSkeletonGrid count={4} label="Loading admin overview" />
      <TableSkeleton rows={8} cols={5} label="Loading admin records" />
    </div>
  );
}
