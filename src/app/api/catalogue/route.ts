import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

const PAGE_SIZE = 32;

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

function shuffleInterleaved(items: VariantItem[], rngSeed: string): VariantItem[] {
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

  const creatorMap = new Map<string, Map<string, VariantItem[]>>();
  for (const item of items) {
    const cId = item.product.creatorId;
    const pId = item.productId;
    if (!creatorMap.has(cId)) creatorMap.set(cId, new Map());
    const productMap = creatorMap.get(cId)!;
    const g = productMap.get(pId) ?? [];
    g.push(item);
    productMap.set(pId, g);
  }

  const interleavedPerCreator: VariantItem[][] = fyShuffle(
    [...creatorMap.values()].map((productMap) => {
      const shuffledGroups = fyShuffle(
        [...productMap.values()].map((g) => fyShuffle(g))
      );
      const result: VariantItem[] = [];
      const maxLen = Math.max(...shuffledGroups.map((g) => g.length));
      for (let i = 0; i < maxLen; i++) {
        for (const group of shuffledGroups) {
          if (i < group.length) result.push(group[i] as VariantItem);
        }
      }
      return result;
    })
  );

  const finalResult: VariantItem[] = [];
  const maxLen = Math.max(...interleavedPerCreator.map((g) => g.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const group of interleavedPerCreator) {
      if (i < group.length) finalResult.push(group[i] as VariantItem);
    }
  }
  return finalResult;
}

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

  // Expand genders (Unisexe logic)
  const expandedGenders = new Set(selectedGenders);
  if (expandedGenders.has('Homme') || expandedGenders.has('Femme')) {
    expandedGenders.add('Unisexe');
  } else if (expandedGenders.size === 1 && expandedGenders.has('Unisexe')) {
    expandedGenders.add('Homme');
    expandedGenders.add('Femme');
  }
  const gendersForQuery = [...expandedGenders];

  const [variants, maxPriceProduct] = await Promise.all([
    prisma.productVariant.findMany({
      where: {
        product: {
          status: 'PUBLISHED',
          ...(selectedStyles.length > 0 ? { style: { name: { in: selectedStyles } } } : {}),
          ...(gendersForQuery.length > 0 ? { gender: { in: gendersForQuery } } : {}),
        },
        ...(selectedSizes.length > 0 ? { skus: { some: { size: { in: selectedSizes }, stock: { gt: 0 } } } } : {}),
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
    }),
    prisma.product.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { price: 'desc' },
      select: { price: true },
    }),
  ]);

  const dynamicMaxPrice = Math.ceil((maxPriceProduct?.price ?? 50000) / 100);
  const maxRaw = Number.parseInt(searchParams.get('maxPrice') ?? '', 10);
  const maxPriceEuros = searchParams.get('maxPrice') && !Number.isNaN(maxRaw) ? maxRaw : dynamicMaxPrice;
  const maxPrice = maxPriceEuros * 100;

  const filtered = variants.filter((v) => {
    const price = v.priceOverride ?? v.product.price;
    return price >= minPrice && price <= maxPrice;
  });

  let sorted: VariantItem[];
  if (sort === 'price_asc') {
    sorted = [...filtered].sort((a, b) => (a.priceOverride ?? a.product.price) - (b.priceOverride ?? b.product.price));
  } else if (sort === 'price_desc') {
    sorted = [...filtered].sort((a, b) => (b.priceOverride ?? b.product.price) - (a.priceOverride ?? a.product.price));
  } else {
    sorted = shuffleInterleaved(filtered, seed);
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
