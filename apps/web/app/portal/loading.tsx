import { SkeletonBar } from '@/components/skeletons/CardSkeleton';

/**
 * Route-level loading state for the client portal (invite/approval links).
 *
 * The portal fetches post data and approval state from the API, so there is
 * genuine network latency before the page resolves. A simple card skeleton
 * approximates the portal card layout without committing to its exact shape.
 */
export default function PortalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen items-center justify-center px-4"
    >
      <span className="sr-only">Loading portal</span>
      <div
        aria-hidden="true"
        className="w-full max-w-xl animate-pulse space-y-5 rounded-brand border border-border bg-bg-card p-8 shadow-sm"
      >
        <SkeletonBar className="h-6 w-48" />
        <SkeletonBar className="h-3 w-72" />
        <div className="space-y-3 pt-2">
          <SkeletonBar className="h-48 w-full rounded-brand" />
        </div>
        <div className="flex gap-3 pt-2">
          <SkeletonBar className="h-10 w-28 rounded-btn" />
          <SkeletonBar className="h-10 w-28 rounded-btn" />
        </div>
      </div>
    </div>
  );
}
