import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { shuffleInterleaved } from '@/lib/utils/catalogue-shuffle';
import { fetchCatalogueVariants } from '@/lib/utils/catalogue-query';

const PAGE_SIZE = 32;

// P1 : cache du prix max (rarement modifié — 10 min)
const getCachedMaxPrice = unstable_cache(
  async () =>
    prisma.product.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { price: 'desc' },
      select: { price: true },
    }),
  ['catalogue-max-price'],
  { revalidate: 600, tags: ['products'] }
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const selectedStyles = searchParams.get('style')?.split(',').filter(Boolean) ?? [];
  const selectedSizes = searchParams.get('size')?.split(',').filter(Boolean) ?? [];
  const selectedGenders = searchParams.get('gender')?.split(',').filter(Boolean) ?? [];
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Math.max(0, Number.parseInt(searchParams.get('page') ?? '0', 10));
  const seed = searchParams.get('seed') ?? Math.random().toString(36);

  const minRaw = Number.parseInt(searchParams.get('minPrice') ?? '', 10);
  const minPriceEuros = searchParams.get('minPrice') && !Number.isNaN(minRaw) ? Math.max(0, minRaw) : 0;
  const minPrice = minPriceEuros * 100;

  // P1 : prix max via cache
  const maxPriceProduct = await getCachedMaxPrice();
  const dynamicMaxPrice = Math.ceil((maxPriceProduct?.price ?? 50000) / 100);
  const maxRaw = Number.parseInt(searchParams.get('maxPrice') ?? '', 10);
  const maxPriceEuros = searchParams.get('maxPrice') && !Number.isNaN(maxRaw) ? maxRaw : dynamicMaxPrice;
  const maxPrice = maxPriceEuros * 100;

  const variants = await fetchCatalogueVariants({
    selectedStyles,
    selectedSizes,
    selectedGenders,
    sort,
    minPriceCents: minPrice,
    maxPriceCents: maxPrice,
  });

  let sorted: typeof variants;
  if (sort === 'price_asc') {
    sorted = [...variants].sort((a, b) => (a.priceOverride ?? a.product.price) - (b.priceOverride ?? b.product.price));
  } else if (sort === 'price_desc') {
    sorted = [...variants].sort((a, b) => (b.priceOverride ?? b.product.price) - (a.priceOverride ?? a.product.price));
  } else {
    sorted = shuffleInterleaved(variants, seed);
  }

  const totalCount = sorted.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const offset = page * PAGE_SIZE;
  const pageItems = sorted.slice(offset, offset + PAGE_SIZE);

  return NextResponse.json({
    variants: pageItems.map((v) => ({
      id: v.id,
      images: v.images,
      priceOverride: v.priceOverride,
      productId: v.productId,
      product: v.product,
      skus: v.skus,
    })),
    totalCount,
    totalPages,
    hasMore: page + 1 < totalPages,
    seed,
  });
}
