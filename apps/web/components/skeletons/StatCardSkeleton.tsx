import { SkeletonBar } from './CardSkeleton';

/** See CardSkeleton for the theming and accessibility rationale. */

export function StatCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-brand border border-border border-border bg-bg-card p-5 shadow-sm"
    >
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="mt-3 h-7 w-16" />
      <SkeletonBar className="mt-2 h-3 w-12" />
    </div>
  );
}

export function StatCardSkeletonGrid({
  count = 4,
  label = 'Loading statistics',
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
