export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded bg-muted" />
      </div>
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border">
        <div className="h-12 animate-pulse bg-muted/50" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-16 items-center gap-4 border-t bg-card px-4">
            <div className="h-10 w-10 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-6 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
