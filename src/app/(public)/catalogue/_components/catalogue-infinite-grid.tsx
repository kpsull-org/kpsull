'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface VariantItem {
  id: string;
  images: unknown;
  priceOverride: number | null;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    creatorId: string;
  };
}

interface CatalogueInfiniteGridProps {
  readonly initialVariants: VariantItem[];
  readonly hasMore: boolean;
  readonly seed: string;
  readonly currentParams: {
    style?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    sort?: string;
    gender?: string;
  };
}

function ProductSkeleton() {
  return (
    <div className="bg-white border-t border-black">
      <div className="aspect-square bg-[#EBEBEB] animate-pulse" />
      <div className="border-t border-black px-3 py-2.5 space-y-1.5">
        <div className="h-2.5 w-3/4 bg-[#EBEBEB] animate-pulse" />
        <div className="h-3 w-1/3 bg-[#EBEBEB] animate-pulse" />
      </div>
    </div>
  );
}

export function CatalogueInfiniteGrid({
  initialVariants,
  hasMore: initialHasMore,
  seed: initialSeed,
  currentParams,
}: CatalogueInfiniteGridProps) {
  const [variants, setVariants] = useState<VariantItem[]>(initialVariants);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [seed] = useState(initialSeed);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset when filters change (server re-renders with new initialVariants)
  useEffect(() => {
    setVariants(initialVariants);
    setPage(0);
    setHasMore(initialHasMore);
  }, [JSON.stringify(currentParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    const qs = new URLSearchParams({ page: String(nextPage), seed });
    if (currentParams.style) qs.set('style', currentParams.style);
    if (currentParams.minPrice) qs.set('minPrice', currentParams.minPrice);
    if (currentParams.maxPrice) qs.set('maxPrice', currentParams.maxPrice);
    if (currentParams.size) qs.set('size', currentParams.size);
    if (currentParams.sort) qs.set('sort', currentParams.sort);
    if (currentParams.gender) qs.set('gender', currentParams.gender);

    try {
      const res = await fetch(`/api/catalogue?${qs}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json() as {
        variants: VariantItem[];
        hasMore: boolean;
      };
      setVariants((prev) => [...prev, ...data.variants]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch {
      // Silently fail — user can scroll back up and retry
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, seed, currentParams]);

  // Intersection Observer — rootMargin 400px = prefetch avant que l'utilisateur atteigne le bas
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loadMore]);

  if (variants.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">Aucun produit</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {variants.map((variant, idx) => {
          const images = Array.isArray(variant.images) ? (variant.images as string[]) : [];
          const firstImage = images[0] ?? null;
          const secondImage = images[1] ?? null;
          const displayPrice = variant.priceOverride ?? variant.product.price;

          return (
            <Link
              key={variant.id}
              href={`/catalogue/${variant.product.id}?variant=${variant.id}`}
              className={`group block bg-white border-t border-black [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 lg:[&:nth-child(-n+4)]:border-t-0 kp-scroll-reveal-delay-${(idx % 4) + 1}`}
            >
              <div className="aspect-square relative overflow-hidden bg-[#F5F5F3]">
                {firstImage ? (
                  <>
                    <Image
                      src={firstImage}
                      alt={variant.product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={`object-cover transition-all duration-500 ${
                        secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
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

        {/* Skeleton loaders pendant le chargement — complète la grille */}
        {loading && ['sk-0', 'sk-1', 'sk-2', 'sk-3'].map((key) => (
          <ProductSkeleton key={key} />
        ))}
      </div>

      {/* Sentinel — déclenche le chargement 400px avant le bas */}
      <div ref={loaderRef} className="h-1" aria-hidden="true" />

      {!hasMore && variants.length > 0 && (
        <p className="py-10 text-center text-[10px] uppercase tracking-[0.2em] text-black/30">
          Tous les produits ont été chargés
        </p>
      )}
    </>
  );
}
