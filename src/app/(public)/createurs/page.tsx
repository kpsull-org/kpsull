import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Créateurs — KPSULL',
  description: 'Découvrez tous les créateurs de mode indépendants sur KPSULL.',
  openGraph: {
    title: 'Créateurs — KPSULL',
    description: 'Découvrez tous les créateurs de mode indépendants sur KPSULL.',
    type: 'website',
    siteName: 'Kpsull',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Créateurs — KPSULL',
    description: 'Découvrez tous les créateurs de mode indépendants sur KPSULL.',
  },
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function CreateursPage() {
  const pages = await prisma.creatorPage.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
  });

  const creatorIds = pages.map((p) => p.creatorId);

  const variants =
    creatorIds.length > 0
      ? await prisma.productVariant.findMany({
          where: {
            product: {
              creatorId: { in: creatorIds },
              status: 'PUBLISHED',
            },
          },
          select: {
            id: true,
            images: true,
            priceOverride: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                creatorId: true,
              },
            },
          },
          orderBy: { product: { publishedAt: 'desc' } },
        })
      : [];

  // Group variants by creatorId, max 4 with images per creator
  const variantsByCreator = new Map<string, typeof variants>();
  for (const v of variants) {
    const imgs = Array.isArray(v.images) ? (v.images as string[]) : [];
    if (!imgs[0]) continue;
    const list = variantsByCreator.get(v.product.creatorId) ?? [];
    if (list.length < 4) {
      list.push(v);
      variantsByCreator.set(v.product.creatorId, list);
    }
  }

  return (
    <main className="min-h-screen bg-white font-[family-name:var(--font-montserrat)]">
      {/* En-tête */}
      <div className="border-b border-black px-6 py-8 md:px-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">
          Kpsull
        </p>
        <h1 className="mt-1 text-2xl font-bold uppercase tracking-tight text-black md:text-3xl">
          Créateurs
        </h1>
        {pages.length > 0 && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/40">
            {pages.length} créateur{pages.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">
            Aucun créateur pour le moment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {pages.map((page, idx) => {
            const previewVariants = variantsByCreator.get(page.creatorId) ?? [];

            return (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className={[
                  'group block border-b border-black',
                  idx % 2 === 0 ? 'sm:border-r' : '',
                ].join(' ')}
              >
                      {/* Bannière */}
                      <div className="relative aspect-video overflow-hidden bg-[#EBEBEB]">
                        {page.bannerImage ? (
                          <Image
                            src={page.bannerImage}
                            alt={page.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#F0F0EE]" />
                        )}
                        {/* Nom en overlay */}
                        <div className="absolute inset-0 bg-black/30 flex items-end p-4 md:p-6">
                          <p className="font-[family-name:var(--font-jacquard-12)] text-3xl leading-none text-white md:text-4xl">
                            {page.title}
                          </p>
                        </div>
                      </div>

                      {/* Infos texte (avec padding) */}
                      {(page.tagline ?? page.description) && (
                        <div className="border-t border-black px-4 py-3 md:px-6">
                          {page.tagline && (
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/50">
                              {page.tagline}
                            </p>
                          )}
                          {page.description && (
                            <p className="line-clamp-2 text-sm text-black/60">
                              {page.description}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Mini-grille produits — pleine largeur, bord à bord */}
                      {previewVariants.length > 0 && (
                        <div className="border-t border-black/10 grid grid-cols-4 gap-2 p-2">
                          {previewVariants.map((v) => {
                            const imgs = Array.isArray(v.images)
                              ? (v.images as string[])
                              : [];
                            const img1 = imgs[0] ?? null;
                            const img2 = imgs[1] ?? null;
                            const price = v.priceOverride ?? v.product.price;

                            return (
                              <div
                                key={v.id}
                                className="group/item relative aspect-square overflow-hidden bg-[#F5F5F3]"
                              >
                                {img1 && (
                                  <>
                                    <Image
                                      src={img1}
                                      alt={v.product.name}
                                      fill
                                      sizes="12vw"
                                      className={`object-cover transition-all duration-500 ${
                                        img2
                                          ? 'group-hover/item:opacity-0'
                                          : 'group-hover/item:scale-105'
                                      }`}
                                    />
                                    {img2 && (
                                      <Image
                                        src={img2}
                                        alt={v.product.name}
                                        fill
                                        sizes="12vw"
                                        className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 group-hover/item:opacity-100"
                                      />
                                    )}
                                  </>
                                )}
                                {/* Prix : visible uniquement au hover, en bas à droite */}
                                <span className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 backdrop-blur-[2px]">
                                  {formatPrice(price)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
