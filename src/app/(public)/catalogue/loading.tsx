export default function CatalogueLoading() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-montserrat)]">
      <div className="flex">
        {/* Sidebar desktop skeleton */}
        <aside className="hidden md:flex w-[210px] flex-shrink-0 flex-col sticky top-0 h-screen overflow-y-auto border-r border-black">
          <div className="p-5 space-y-6">
            {/* Sort skeleton */}
            <div className="space-y-2.5">
              <div className="h-2 w-14 animate-pulse bg-gray-200" />
              <div className="h-3 w-24 animate-pulse bg-gray-200" />
            </div>

            <div className="h-px bg-black/10" />

            {/* Style skeleton */}
            <div className="space-y-2.5">
              <div className="h-2 w-10 animate-pulse bg-gray-200" />
              <div className="space-y-2">
                {['s1', 's2', 's3', 's4', 's5'].map((id) => (
                  <div key={id} className="h-3 w-full animate-pulse bg-gray-200" />
                ))}
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Genre skeleton */}
            <div className="space-y-2.5">
              <div className="h-2 w-12 animate-pulse bg-gray-200" />
              <div className="flex flex-wrap gap-1.5">
                {['g1', 'g2', 'g3'].map((id) => (
                  <div key={id} className="h-6 w-16 animate-pulse bg-gray-200" />
                ))}
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Taille skeleton */}
            <div className="space-y-2.5">
              <div className="h-2 w-12 animate-pulse bg-gray-200" />
              <div className="flex flex-wrap gap-1.5">
                {['t1', 't2', 't3', 't4'].map((id) => (
                  <div key={id} className="h-6 w-10 animate-pulse bg-gray-200" />
                ))}
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Prix skeleton */}
            <div className="space-y-3">
              <div className="h-2 w-8 animate-pulse bg-gray-200" />
              <div className="h-3 w-full animate-pulse bg-gray-200" />
              <div className="flex justify-between">
                <div className="h-2 w-6 animate-pulse bg-gray-200" />
                <div className="h-2 w-10 animate-pulse bg-gray-200" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile filter button skeleton */}
          <div className="md:hidden px-4 py-3 border-b border-black">
            <div className="h-8 w-full animate-pulse bg-gray-100" />
          </div>

          {/* Product grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[
              'p01', 'p02', 'p03', 'p04',
              'p05', 'p06', 'p07', 'p08',
              'p09', 'p10', 'p11', 'p12',
            ].map((id, index) => (
              <div
                key={id}
                className={`border-t border-black ${
                  index < 2 ? 'border-t-0' : ''
                } sm:[&:nth-child(-n+3)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0`}
              >
                {/* Image skeleton */}
                <div className="aspect-square animate-pulse bg-gray-100" />
                {/* Info skeleton */}
                <div className="border-t border-black px-3 py-2.5 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse bg-gray-200" />
                  <div className="h-3 w-16 animate-pulse bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
