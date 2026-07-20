/**
 * Skeletons use theme tokens, not hardcoded greys.
 *
 * These previously used `bg-white` / `bg-gray-200`, which rendered as white
 * blocks on the dark background (--color-bg is #0F172A in dark mode). Every
 * surface now resolves through the same CSS variables as the real content it
 * stands in for, so a skeleton looks like the thing that is loading.
 *
 * Accessibility: the decorative boxes are aria-hidden and the group carries a
 * single live-region label, so a screen reader announces "Loading…" once rather
 * than reading out a tree of empty divs.
 */

export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`rounded bg-border ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-brand border border-border bg-bg-card p-6 shadow-sm"
    >
      <SkeletonBar className="h-4 w-32" />
      <div className="mt-4 space-y-3">
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-3/4" />
        <SkeletonBar className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  label = 'Loading content',
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
