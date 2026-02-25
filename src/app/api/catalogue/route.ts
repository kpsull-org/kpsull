import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { shuffleInterleaved } from '@/lib/utils/catalogue-shuffle';

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

type VariantItem = {
  id: string;
  images: unknown;
  priceOverride: number | null;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    style: { name: string } | null;
    category: string | null;
    gender: string | null;
    creatorId: string;
  };
  skus: { size: string | null; stock: number }[];
};

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

  // Expand genders (Unisexe logic)
  const expandedGenders = new Set(selectedGenders);
  if (expandedGenders.has('Homme') || expandedGenders.has('Femme')) {
    expandedGenders.add('Unisexe');
  } else if (expandedGenders.size === 1 && expandedGenders.has('Unisexe')) {
    expandedGenders.add('Homme');
    expandedGenders.add('Femme');
  }
  const gendersForQuery = [...expandedGenders];

  // P10 : filtre prix poussé dans la clause WHERE Prisma
  const variants = await prisma.productVariant.findMany({
    where: {
      product: {
        status: 'PUBLISHED',
        ...(selectedStyles.length > 0 ? { style: { name: { in: selectedStyles } } } : {}),
        ...(gendersForQuery.length > 0 ? { gender: { in: gendersForQuery } } : {}),
      },
      ...(selectedSizes.length > 0 ? { skus: { some: { size: { in: selectedSizes }, stock: { gt: 0 } } } } : {}),
      OR: [
        { priceOverride: { gte: minPrice, lte: maxPrice } },
        {
          priceOverride: null,
          product: { price: { gte: minPrice, lte: maxPrice } },
        },
      ],
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
      if (sort === 'price_asc') return { product: { price: 'asc' as const } };
      if (sort === 'price_desc') return { product: { price: 'desc' as const } };
      return { product: { publishedAt: 'desc' as const } };
    })(),
    take: 200,
  });

  let sorted: VariantItem[];
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
