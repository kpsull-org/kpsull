export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </div>
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="h-12 animate-pulse bg-muted/50" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-4 border-t bg-card px-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
