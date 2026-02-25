import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/client";
import { shuffleInterleaved } from "@/lib/utils/catalogue-shuffle";
import { fetchCatalogueVariants } from "@/lib/utils/catalogue-query";
import { FilterSidebar } from "./_components/filter-sidebar";
import { CatalogueInfiniteGrid } from "./_components/catalogue-infinite-grid";

const PAGE_SIZE = 32;

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Catalogue — KPSULL",
  description:
    "Découvrez les créations uniques de nos créateurs de mode locaux.",
};

// ─── P1 : Cache metadata des filtres (styles, tailles, prix max) — 10 min ────

const getCatalogueFilterMeta = unstable_cache(
  async () => {
    const [styles, skuSizesRaw, maxPriceProduct] = await Promise.all([
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
      prisma.product.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { price: "desc" },
        select: { price: true },
      }),
    ]);
    return { styles, skuSizesRaw, maxPriceProduct };
  },
  ["catalogue-filter-meta"],
  { revalidate: 600, tags: ["styles", "products"] }
);

// ─── P1 + P10 : Cache variantes par combinaison de filtres — 2 min ────────────
// Le filtre prix est poussé dans la clause WHERE Prisma (P10).

const getCatalogueVariants = unstable_cache(
  async (
    styleKey: string,
    sizeKey: string,
    genderKey: string,
    sort: string,
    minPriceCents: number,
    maxPriceCents: number
  ) => {
    return fetchCatalogueVariants({
      selectedStyles: styleKey ? styleKey.split(",") : [],
      selectedSizes: sizeKey ? sizeKey.split(",") : [],
      selectedGenders: genderKey ? genderKey.split(",") : [],
      sort,
      minPriceCents,
      maxPriceCents,
    });
  },
  ["catalogue-variants"],
  { revalidate: 120, tags: ["products"] }
);

// ─── Page ─────────────────────────────────────────────────────────────────────

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

export default async function CataloguePage({
  searchParams,
}: Readonly<CataloguePageProps>) {
  const params = await searchParams;
  const sort = params.sort ?? "newest";

  // P1 : métadonnées des filtres (cachées 10 min)
  const { styles, skuSizesRaw, maxPriceProduct } = await getCatalogueFilterMeta();
  const dynamicMaxPrice = Math.ceil((maxPriceProduct?.price ?? 50000) / 100);

  // Calcul des prix en centimes
  const minRaw = Number.parseInt(params.minPrice ?? "", 10);
  const minPriceEuros = params.minPrice && !Number.isNaN(minRaw) ? Math.max(0, minRaw) : 0;
  const maxRaw = Number.parseInt(params.maxPrice ?? "", 10);
  const maxPriceEuros =
    params.maxPrice && !Number.isNaN(maxRaw) ? maxRaw : dynamicMaxPrice;
  const minPriceCents = minPriceEuros * 100;
  const maxPriceCents = maxPriceEuros * 100;

  // P1 + P10 : variantes avec filtre prix dans WHERE, résultat caché 2 min
  const variants = await getCatalogueVariants(
    params.style ?? "",
    params.size ?? "",
    params.gender ?? "",
    sort,
    minPriceCents,
    maxPriceCents
  );

  // Graine aléatoire par requête : change à chaque rechargement
  const seed = Math.random().toString(36);

  const allFilteredVariants = (() => {
    if (sort === "price_asc") {
      return [...variants].sort(
        (a, b) => (a.priceOverride ?? a.product.price) - (b.priceOverride ?? b.product.price),
      );
    }
    if (sort === "price_desc") {
      return [...variants].sort(
        (a, b) => (b.priceOverride ?? b.product.price) - (a.priceOverride ?? a.product.price),
      );
    }
    return shuffleInterleaved(variants, seed);
  })();

  // Pagination : SSR des 32 premiers, le reste chargé via CatalogueInfiniteGrid
  const initialVariants = allFilteredVariants.slice(0, PAGE_SIZE);
  const hasMore = allFilteredVariants.length > PAGE_SIZE;

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

          {/* Grid infinite scroll */}
          <CatalogueInfiniteGrid
            initialVariants={initialVariants}
            hasMore={hasMore}
            seed={seed}
            currentParams={currentParams}
          />
        </main>
      </div>
    </div>
  );
}
