'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/format';
import type { PublicProductListItem } from '@/modules/products/application/use-cases/public/list-public-products.use-case';

interface InfiniteProductGridProps {
  initialProducts: PublicProductListItem[];
  initialPage: number;
  totalPages: number;
  slug: string;
  search?: string;
  projectId?: string;
}

export function InfiniteProductGrid({
  initialProducts,
  initialPage,
  totalPages,
  slug,
  search,
  projectId,
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState<PublicProductListItem[]>(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    const queryParams = new URLSearchParams({ page: String(nextPage) });
    if (search) queryParams.set('search', search);
    if (projectId) queryParams.set('project', projectId);

    try {
      const res = await fetch(`/api/public/${slug}/products?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json() as {
        products: PublicProductListItem[];
        pages: number;
      };
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
      setHasMore(nextPage < data.pages);
    } catch {
      // En cas d'erreur réseau, on ne relance pas indéfiniment
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, slug, search, projectId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loadMore]);

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Aucun produit disponible</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${slug}/products/${product.id}`}
            className="group"
          >
            <div className="overflow-hidden transition-transform hover:scale-105">
              <div className="relative aspect-square overflow-hidden rounded-[15px] bg-muted">
                {product.mainImageUrl ? (
                  <Image
                    src={product.mainImageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="truncate font-semibold uppercase font-[family-name:var(--font-montserrat)]">
                  {product.name}
                </h3>
                <p className="mt-2 font-bold font-[family-name:var(--font-montserrat)]">
                  {formatPrice(product.price * 100)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Sentinel pour l'Intersection Observer */}
      <div ref={loaderRef} className="mt-4 h-8" aria-hidden="true" />

      {loading && (
        <div className="mt-0 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden">
              <div className="aspect-square animate-pulse rounded-[15px] bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Tous les produits ont été chargés
        </p>
      )}
    </>
  );
}
