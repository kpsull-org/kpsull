export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="h-[60vh] bg-muted animate-pulse" />

      {/* Content skeletons */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}
