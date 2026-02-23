export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {['revenue', 'orders', 'customers', 'products'].map((id) => (
          <div key={id} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Revenue chart skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded bg-muted" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {['orders', 'products', 'messages', 'settings'].map((id) => (
          <div key={id} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
