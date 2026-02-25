import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/client";
import { FilterSidebar } from "./_components/filter-sidebar";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Catalogue — KPSULL",
  description:
    "Découvrez les créations uniques de nos créateurs de mode locaux.",
};

interface CataloguePageProps {
  searchParams: Promise<{
    style?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    sort?: string;
    gender?: string;
  }>;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function CataloguePage({
  searchParams,
}: Readonly<CataloguePageProps>) {
  const params = await searchParams;

  const selectedStyles = params.style ? params.style.split(",").filter(Boolean) : [];
  const selectedSizes = params.size ? params.size.split(",").filter(Boolean) : [];
  const selectedGenders = params.gender ? params.gender.split(",").filter(Boolean) : [];
  // Expansion genre : Unisexe est toujours associé à Homme et Femme (dans les deux sens)
  // - Sélection Homme ou Femme → inclut aussi Unisexe
  // - Sélection Unisexe seul → inclut aussi Homme et Femme
  // - Bébé et Enfant restent isolés
  const expandedGenders = new Set(selectedGenders);
  if (expandedGenders.has("Homme") || expandedGenders.has("Femme")) {
    expandedGenders.add("Unisexe");
  } else if (expandedGenders.size === 1 && expandedGenders.has("Unisexe")) {
    expandedGenders.add("Homme");
    expandedGenders.add("Femme");
  }
  const gendersForQuery = [...expandedGenders];
  const sort = params.sort ?? "newest";

  // Price in euros from search params, convert to cents for DB query
  const minRaw = Number.parseInt(params.minPrice ?? "", 10);
  const minPriceEuros = params.minPrice && !Number.isNaN(minRaw) ? Math.max(0, minRaw) : 0;

  const [styles, skuSizesRaw, variants, maxPriceProduct] = await Promise.all([
    prisma.style.findMany({
      where: { status: "APPROVED", isCustom: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.productSku.findMany({
      where: {
        stock: { gt: 0 },
        product: { status: "PUBLISHED" },
        size: { not: null },
      },
      select: { size: true },
      distinct: ["size"],
    }),
    prisma.productVariant.findMany({
      where: {
        product: {
          status: "PUBLISHED",
          ...(selectedStyles.length > 0
            ? {
                style: {
                  name: { in: selectedStyles },
                },
              }
            : {}),
          ...(gendersForQuery.length > 0 ? { gender: { in: gendersForQuery } } : {}),
        },
        ...(selectedSizes.length > 0
          ? {
              skus: {
                some: { size: { in: selectedSizes }, stock: { gt: 0 } },
              },
            }
          : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            style: { select: { name: true } },
            category: true,
            gender: true,
            creatorId: true,
          },
        },
        skus: {
          select: { size: true, stock: true },
          where: { stock: { gt: 0 } },
        },
      },
      orderBy: (() => {
        if (sort === "price_asc") return { product: { price: "asc" as const } };
        if (sort === "price_desc") return { product: { price: "desc" as const } };
        return { product: { publishedAt: "desc" as const } };
      })(),
      take: 200,
    }),
    prisma.product.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { price: "desc" },
      select: { price: true },
    }),
  ]);

  const dynamicMaxPrice = Math.ceil((maxPriceProduct?.price ?? 50000) / 100);

  // Apply price filter after fetching dynamicMaxPrice
  const maxRaw = Number.parseInt(params.maxPrice ?? "", 10);
  const maxPriceEuros =
    params.maxPrice && !Number.isNaN(maxRaw) ? maxRaw : dynamicMaxPrice;
  const minPrice = minPriceEuros * 100;
  const maxPrice = maxPriceEuros * 100;

  // Graine aléatoire par requête : change à chaque rechargement
  const seed = Math.random().toString(36);

  function seededRng(seed: string) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.codePointAt(i) ?? 0;
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13;
      h ^= h >> 17;
      h ^= h << 5;
      return (h >>> 0) / 0x100000000;
    };
  }

  function shuffleInterleaved<T extends { productId: string; product: { creatorId: string } }>(
    items: T[],
    rngSeed: string
  ): T[] {
    const rand = seededRng(rngSeed);
    const fyShuffle = <U,>(arr: U[]): U[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = a[i] as U;
        a[i] = a[j] as U;
        a[j] = tmp;
      }
      return a;
    };

    // Grouper par (creatorId, productId) pour interleaving à 2 niveaux
    const creatorMap = new Map<string, Map<string, T[]>>();
    for (const item of items) {
      const cId = item.product.creatorId;
      const pId = item.productId;
      if (!creatorMap.has(cId)) creatorMap.set(cId, new Map());
      const productMap = creatorMap.get(cId)!;
      const g = productMap.get(pId) ?? [];
      g.push(item);
      productMap.set(pId, g);
    }

    // Pour chaque créateur : interleaving round-robin des variantes par produit
    const interleavedPerCreator: T[][] = fyShuffle(
      [...creatorMap.values()].map((productMap) => {
        const shuffledGroups = fyShuffle(
          [...productMap.values()].map((g) => fyShuffle(g))
        );
        const result: T[] = [];
        const maxLen = Math.max(...shuffledGroups.map((g) => g.length));
        for (let i = 0; i < maxLen; i++) {
          for (const group of shuffledGroups) {
            if (i < group.length) result.push(group[i] as T);
          }
        }
        return result;
      })
    );

    // Interleaving round-robin des créateurs : jamais 2 produits du même créateur côte à côte
    const finalResult: T[] = [];
    const maxLen = Math.max(...interleavedPerCreator.map((g) => g.length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const group of interleavedPerCreator) {
        if (i < group.length) finalResult.push(group[i] as T);
      }
    }
    return finalResult;
  }

  const filteredVariants = (() => {
    const filtered = variants.filter((v) => {
      const price = v.priceOverride ?? v.product.price;
      return price >= minPrice && price <= maxPrice;
    });
    if (sort === "price_asc") {
      return [...filtered].sort(
        (a, b) => (a.priceOverride ?? a.product.price) - (b.priceOverride ?? b.product.price),
      );
    }
    if (sort === "price_desc") {
      return [...filtered].sort(
        (a, b) => (b.priceOverride ?? b.product.price) - (a.priceOverride ?? a.product.price),
      );
    }
    // Par défaut : ordre vraiment aléatoire, change à chaque reload
    return shuffleInterleaved(filtered, seed);
  })();

  const sizes = skuSizesRaw
    .map((s) => s.size)
    .filter((s): s is string => s !== null);

  const currentParams = {
    style: params.style,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    size: params.size,
    sort: params.sort,
    gender: params.gender,
  };

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-montserrat)]">
      <div className="flex">
        {/* Sidebar desktop - collée à gauche, sticky */}
        <aside className="hidden md:flex w-[210px] flex-shrink-0 flex-col sticky top-0 h-screen overflow-y-auto border-r border-black">
          <div className="p-5 flex-1">
            <FilterSidebar
              styles={styles}
              sizes={sizes}
              priceMax={dynamicMaxPrice}
              currentParams={currentParams}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile filter button */}
          <div className="md:hidden px-4 py-3 border-b border-black">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border border-black/20 text-black/60 uppercase text-[10px] tracking-[0.15em] rounded-none"
                >
                  <Filter className="w-3 h-3 mr-2" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="px-5 py-4 border-b border-black">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">
                    Filtres
                  </span>
                </div>
                <div className="p-5">
                  <FilterSidebar
                    styles={styles}
                    sizes={sizes}
                    priceMax={dynamicMaxPrice}
                    currentParams={currentParams}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Grid */}
          {filteredVariants.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">
                Aucun produit
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filteredVariants.map((variant, idx) => {
                const images = Array.isArray(variant.images)
                  ? (variant.images as string[])
                  : [];
                const firstImage = images[0] ?? null;
                const secondImage = images[1] ?? null;
                const displayPrice =
                  variant.priceOverride ?? variant.product.price;

                return (
                  <Link
                    key={variant.id}
                    href={`/catalogue/${variant.product.id}?variant=${variant.id}`}
                    className={`group block bg-white border-t border-black [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0 kp-scroll-reveal-delay-${(idx % 4) + 1}`}
                  >
                    {/* Image carrée */}
                    <div className="aspect-square relative overflow-hidden bg-[#F5F5F3]">
                      {firstImage ? (
                        <>
                          <Image
                            src={firstImage}
                            alt={variant.product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-cover transition-all duration-500 ${
                              secondImage
                                ? "group-hover:opacity-0"
                                : "group-hover:scale-105"
                            }`}
                          />
                          {secondImage && (
                            <Image
                              src={secondImage}
                              alt={`${variant.product.name} — vue 2`}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#EBEBEB]" />
                      )}
                    </div>

                    {/* Info — séparée par une bordure */}
                    <div className="border-t border-black px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-black truncate">
                        {variant.product.name}
                      </p>
                      <p className="text-[12px] font-bold text-black mt-0.5">
                        {formatPrice(displayPrice)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
