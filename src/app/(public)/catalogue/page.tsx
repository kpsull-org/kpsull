import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/client";
import { FilterSidebar } from "./_components/filter-sidebar";

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
}: CataloguePageProps) {
  const params = await searchParams;

  const selectedStyles = params.style ? params.style.split(",").filter(Boolean) : [];
  const selectedSizes = params.size ? params.size.split(",").filter(Boolean) : [];
  const selectedGenders = params.gender ? params.gender.split(",").filter(Boolean) : [];
  // Quand seul "Unisexe" est sélectionné, on inclut Homme, Femme et Unisexe
  const gendersForQuery =
    selectedGenders.length === 1 && selectedGenders[0] === "Unisexe"
      ? ["Homme", "Femme", "Unisexe"]
      : selectedGenders;
  const sort = params.sort ?? "newest";

  // Price in euros from search params, convert to cents for DB query
  const minPriceEuros = params.minPrice ? parseInt(params.minPrice, 10) : 0;

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
          },
        },
        skus: {
          select: { size: true, stock: true },
          where: { stock: { gt: 0 } },
        },
      },
      orderBy:
        sort === "price_asc"
          ? { product: { price: "asc" } }
          : sort === "price_desc"
            ? { product: { price: "desc" } }
            : { product: { publishedAt: "desc" } },
    }),
    prisma.product.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { price: "desc" },
      select: { price: true },
    }),
  ]);

  const dynamicMaxPrice = Math.ceil((maxPriceProduct?.price ?? 50000) / 100);

  // Apply price filter after fetching dynamicMaxPrice
  const maxPriceEuros = params.maxPrice
    ? parseInt(params.maxPrice, 10)
    : dynamicMaxPrice;
  const minPrice = minPriceEuros * 100;
  const maxPrice = maxPriceEuros * 100;

  const filteredVariants = variants.filter((v) => {
    const price = v.priceOverride ?? v.product.price;
    return price >= minPrice && price <= maxPrice;
  });

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
          {/* Header sidebar */}
          <div className="px-5 h-[46px] flex items-center border-b border-black">
            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-black/40">
              Filtres
            </span>
          </div>
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
          {/* Header */}
          <div className="px-6 h-[46px] flex items-center justify-between border-b border-black">
            <h1 className="font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-[0.15em]">
              Catalogue
            </h1>
            <span className="text-[10px] uppercase tracking-[0.1em] text-black/40">
              {filteredVariants.length} article
              {filteredVariants.length !== 1 ? "s" : ""}
            </span>
          </div>

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
              {filteredVariants.map((variant) => {
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
                    className="group block bg-white border-t border-black [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0"
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
