import { SkeletonBar } from '@/components/skeletons/CardSkeleton';

/**
 * Route-level loading state for marketing pages.
 *
 * Marketing routes are `force-dynamic` and read CMS content from the API, so
 * they genuinely wait on the network. Deliberately sparse: these pages are
 * mostly prose, and an elaborate skeleton would be a worse approximation than a
 * simple one.
 */
export default function MarketingLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mx-auto max-w-3xl px-4 py-20">
      <span className="sr-only">Loading page</span>
      <div aria-hidden="true" className="animate-pulse space-y-4">
        <SkeletonBar className="mx-auto h-9 w-2/3" />
        <SkeletonBar className="mx-auto h-4 w-full" />
        <SkeletonBar className="mx-auto h-4 w-5/6" />
        <SkeletonBar className="mx-auto h-4 w-3/4" />
        <SkeletonBar className="mx-auto mt-8 h-11 w-40 rounded-btn" />
      </div>
    </div>
  );
}
