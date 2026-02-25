import { prisma } from '@/lib/prisma/client';

/**
 * Shared Prisma include definition for catalogue variant queries.
 * Used by both the catalogue page (SSR) and the catalogue API route.
 */
export const catalogueVariantInclude = {
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
} as const;

/**
 * Builds the expanded genders set for catalogue filtering.
 * Unisexe logic: selecting Homme or Femme also includes Unisexe,
 * and selecting only Unisexe also includes Homme and Femme.
 */
export function expandGenders(selectedGenders: string[]): string[] {
  const expandedGenders = new Set(selectedGenders);
  if (expandedGenders.has('Homme') || expandedGenders.has('Femme')) {
    expandedGenders.add('Unisexe');
  } else if (expandedGenders.size === 1 && expandedGenders.has('Unisexe')) {
    expandedGenders.add('Homme');
    expandedGenders.add('Femme');
  }
  return [...expandedGenders];
}

/**
 * Builds the Prisma orderBy clause for catalogue sorting.
 */
export function catalogueOrderBy(sort: string) {
  if (sort === 'price_asc') return { product: { price: 'asc' as const } };
  if (sort === 'price_desc') return { product: { price: 'desc' as const } };
  return { product: { publishedAt: 'desc' as const } };
}

export interface CatalogueVariantFilters {
  selectedStyles: string[];
  selectedSizes: string[];
  selectedGenders: string[];
  sort: string;
  minPriceCents: number;
  maxPriceCents: number;
}

/**
 * Fetches catalogue variants from the database with the given filters.
 * Shared between the catalogue API route and the SSR catalogue page.
 */
export async function fetchCatalogueVariants({
  selectedStyles,
  selectedSizes,
  selectedGenders,
  sort,
  minPriceCents,
  maxPriceCents,
}: CatalogueVariantFilters) {
  const gendersForQuery = expandGenders(selectedGenders);

  return prisma.productVariant.findMany({
    where: {
      product: {
        status: 'PUBLISHED',
        ...(selectedStyles.length > 0 ? { style: { name: { in: selectedStyles } } } : {}),
        ...(gendersForQuery.length > 0 ? { gender: { in: gendersForQuery } } : {}),
      },
      ...(selectedSizes.length > 0 ? { skus: { some: { size: { in: selectedSizes }, stock: { gt: 0 } } } } : {}),
      OR: [
        { priceOverride: { gte: minPriceCents, lte: maxPriceCents } },
        {
          priceOverride: null,
          product: { price: { gte: minPriceCents, lte: maxPriceCents } },
        },
      ],
    },
    include: catalogueVariantInclude,
    orderBy: catalogueOrderBy(sort),
    take: 200,
  });
}
