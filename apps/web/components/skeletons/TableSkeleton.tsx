import { SkeletonBar } from './CardSkeleton';

/** See CardSkeleton for the theming and accessibility rationale. */

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBar key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  label = 'Loading table',
}: {
  rows?: number;
  cols?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className="animate-pulse overflow-x-auto rounded-brand border border-border bg-bg-card shadow-sm"
      >
        {/* Header row sits slightly stronger than the body rows. */}
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 flex-1 rounded bg-text-muted/40" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </div>
    </div>
  );
}
