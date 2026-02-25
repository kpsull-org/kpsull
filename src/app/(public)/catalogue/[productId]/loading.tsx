export default function ProductLoading() {
  return (
    <div className="bg-white font-[family-name:var(--font-montserrat)]">
      {/* Breadcrumb skeleton */}
      <div className="px-6 py-3 border-b border-black flex items-center gap-2">
        <div className="h-2.5 w-16 animate-pulse bg-gray-200" />
        <div className="h-2.5 w-2 animate-pulse bg-gray-200" />
        <div className="h-2.5 w-28 animate-pulse bg-gray-200" />
      </div>

      {/* Main layout: 2 colonnes desktop */}
      <div className="flex flex-col lg:flex-row border-b border-black">
        {/* Left: Gallery skeleton */}
        <div className="w-full lg:w-[45%] border-r border-black self-start">
          {/* Main image */}
          <div className="aspect-square w-full animate-pulse bg-gray-100" />

          {/* Thumbnails */}
          <div className="flex border-t border-black">
            {['th1', 'th2', 'th3'].map((id) => (
              <div
                key={id}
                className="w-24 aspect-square flex-shrink-0 animate-pulse bg-gray-100 border-r border-black"
              />
            ))}
          </div>
        </div>

        {/* Right: Product info skeleton */}
        <div className="w-full lg:w-[55%] self-start">
          <div className="p-8 lg:p-10 space-y-5">
            {/* Titre + brand */}
            <div className="space-y-2">
              <div className="h-5 w-3/4 animate-pulse bg-gray-200" />
              <div className="h-3 w-32 animate-pulse bg-gray-200" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="h-3 w-full animate-pulse bg-gray-200" />
              <div className="h-3 w-full animate-pulse bg-gray-200" />
              <div className="h-3 w-2/3 animate-pulse bg-gray-200" />
            </div>

            <div className="h-px bg-black/10" />

            {/* Prix */}
            <div className="h-8 w-24 animate-pulse bg-gray-200" />

            <div className="h-px bg-black/10" />

            {/* Sélecteur taille */}
            <div className="space-y-2">
              <div className="h-2.5 w-16 animate-pulse bg-gray-200" />
              <div className="flex flex-wrap gap-1.5">
                {['sz1', 'sz2', 'sz3', 'sz4', 'sz5'].map((id) => (
                  <div key={id} className="h-8 w-12 animate-pulse bg-gray-100" />
                ))}
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Bouton Ajouter au panier */}
            <div className="h-12 w-full animate-pulse bg-gray-200" />

            {/* Informations produit */}
            <div className="space-y-2 pt-2">
              <div className="h-2.5 w-24 animate-pulse bg-gray-200" />
              {['i1', 'i2', 'i3'].map((id) => (
                <div
                  key={id}
                  className="flex justify-between border-b border-black/5 pb-1.5"
                >
                  <div className="h-3 w-20 animate-pulse bg-gray-200" />
                  <div className="h-3 w-16 animate-pulse bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* "Vous aimerez aussi" skeleton */}
      <section className="border-t border-black">
        <div className="px-6 lg:px-8 pt-8 pb-5">
          <div className="h-2.5 w-32 animate-pulse bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {['r1', 'r2', 'r3', 'r4'].map((id) => (
            <div key={id}>
              <div className="aspect-square animate-pulse bg-gray-100" />
              <div className="border-t border-black border-r border-black px-3 py-2.5 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse bg-gray-200" />
                <div className="h-3.5 w-16 animate-pulse bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
