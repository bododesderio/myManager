import { SkeletonBar } from '@/components/skeletons/CardSkeleton';

/**
 * Route-level loading state for internal report-render pages.
 *
 * These pages are only hit by Puppeteer for PDF generation; the skeleton is
 * minimal since render time is dominated by the server fetch, not navigation.
 */
export default function InternalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen items-center justify-center px-4"
    >
      <span className="sr-only">Rendering report</span>
      <div
        aria-hidden="true"
        className="w-full max-w-4xl animate-pulse space-y-4 p-8"
      >
        <SkeletonBar className="h-8 w-64" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-5/6" />
        <SkeletonBar className="mt-6 h-64 w-full rounded-brand" />
        <SkeletonBar className="h-4 w-3/4" />
        <SkeletonBar className="h-4 w-2/3" />
      </div>
    </div>
  );
}
