import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma/client";

// Cache cross-request 5 min — pool de 16 pour permettre le shuffle aléatoire
const getFeaturedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 16,
      include: {
        variants: {
          take: 1,
          select: { images: true },
        },
      },
    });
  },
  ['featured-offers'],
  { revalidate: 300, tags: ['products'] },
);

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export async function FeaturedOffers() {
  const pool = await getFeaturedProducts();
  // Shuffle côté serveur (par requête) puis on prend 8
  const products = fisherYatesShuffle(pool).slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section className="bg-[#F2F2F2] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-semibold uppercase md:text-xl lg:text-2xl">
          OFFRES DU MOMENT
        </h2>
        <p className="mt-1 font-[family-name:var(--font-montserrat)] text-sm tracking-wider text-muted-foreground">
          OFFRES DE LA SAISON
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {products.map((product) => {
            const images = Array.isArray(product.variants[0]?.images)
              ? (product.variants[0].images as string[])
              : [];
            const imageUrl = images[0] ?? null;
            const priceEuros = (product.price / 100).toFixed(2).replace('.00', '');

            return (
              <Link
                key={product.id}
                href={`/catalogue/${product.id}`}
                className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                </div>
                <div className="px-3 py-2">
                  <h3 className="font-[family-name:var(--font-montserrat)] text-xs font-semibold leading-tight md:text-sm line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-[family-name:var(--font-montserrat)] text-sm font-bold">
                    {priceEuros}€
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/catalogue"
            className="font-[family-name:var(--font-montserrat)] px-10 py-3.5 border border-black text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-colors"
          >
            Découvrir toutes nos offres
          </Link>
        </div>
      </div>
    </section>
  );
}
