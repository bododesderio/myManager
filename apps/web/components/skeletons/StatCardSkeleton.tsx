export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-brand border bg-white p-5 shadow-sm">
      <div className="h-3 w-24 rounded bg-gray-200" />
      <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-12 rounded bg-gray-200" />
    </div>
  );
}

export function StatCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
