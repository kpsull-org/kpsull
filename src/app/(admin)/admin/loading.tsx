export default function AdminLoading() {
  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
