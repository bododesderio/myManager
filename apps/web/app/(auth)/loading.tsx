import { SkeletonBar } from '@/components/skeletons/CardSkeleton';

/**
 * Route-level loading state for auth pages.
 *
 * Approximates the auth card so the transition into login/signup does not flash
 * an empty viewport. Kept minimal — these routes are light and usually resolve
 * fast; a heavy skeleton would be more jarring than the wait it covers.
 */
export default function AuthLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen items-center justify-center px-4"
    >
      <span className="sr-only">Loading</span>
      <div
        aria-hidden="true"
        className="w-full max-w-md animate-pulse space-y-4 rounded-brand border border-border bg-bg-card p-8 shadow-sm"
      >
        <SkeletonBar className="mx-auto h-7 w-40" />
        <SkeletonBar className="mx-auto h-3 w-56" />
        <div className="space-y-3 pt-4">
          <SkeletonBar className="h-11 w-full rounded-btn" />
          <SkeletonBar className="h-11 w-full rounded-btn" />
          <SkeletonBar className="h-11 w-full rounded-btn" />
        </div>
      </div>
    </div>
  );
}
