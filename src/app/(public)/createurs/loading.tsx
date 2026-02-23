export default function CreateursLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-black px-6 py-8 md:px-12">
        <div className="mb-2 h-3 w-12 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`border-b border-black ${i % 2 === 0 ? 'sm:border-r' : ''}`}>
            <div className="aspect-video animate-pulse bg-gray-100" />
            <div className="space-y-2 border-t border-black px-4 py-3 md:px-6">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
