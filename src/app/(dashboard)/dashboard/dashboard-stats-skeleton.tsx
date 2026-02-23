export function DashboardStatsSkeleton() {
  return (
    <>
      <section aria-label="Statistiques en chargement">
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-stat-${i}`} className="rounded-lg border bg-card p-6 space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Graphique en chargement">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-6 h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-52 animate-pulse rounded bg-muted" />
        </div>
      </section>
    </>
  );
}
