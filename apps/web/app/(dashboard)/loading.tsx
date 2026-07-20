import { StatCardSkeletonGrid } from '@/components/skeletons/StatCardSkeleton';
import { CardGridSkeleton } from '@/components/skeletons/CardSkeleton';
import { SkeletonBar } from '@/components/skeletons/CardSkeleton';

/**
 * Route-level loading state for every dashboard page
 * (docs/audit-2026-07-20.md §5.2).
 *
 * The app had ZERO loading.tsx files, so navigating between routes showed the
 * previous page frozen until the next one resolved — on a slow connection that
 * reads as an unresponsive app. Placing this at the route-group root covers all
 * ~49 dashboard pages; any individual route can still override it with its own
 * loading.tsx for a closer-fitting shape.
 *
 * The dashboard layout Suspends the sidebar and topbar separately, so only the
 * page body swaps — the chrome stays put and navigation still feels anchored.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div aria-hidden="true" className="animate-pulse space-y-2">
        <SkeletonBar className="h-6 w-48" />
        <SkeletonBar className="h-3 w-72" />
      </div>

      <StatCardSkeletonGrid count={4} label="Loading dashboard" />
      <CardGridSkeleton count={6} label="Loading dashboard content" />
    </div>
  );
}
