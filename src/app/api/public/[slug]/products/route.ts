import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { ListPublicProductsUseCase } from '@/modules/products/application/use-cases/public/list-public-products.use-case';
import { PrismaPublicProductRepository } from '@/modules/products/infrastructure/repositories/prisma-public-product.repository';

/**
 * GET /api/public/[slug]/products
 *
 * Public API for paginated product listing by creator slug.
 * Used by InfiniteProductGrid for client-side infinite scroll.
 *
 * Query Parameters:
 * - page: number (default: 1, min: 1)
 * - search: string (optional)
 * - project: string (optional, filters by projectId)
 */

const PAGE_SIZE = 12;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;

  const rawPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const search = searchParams.get('search') ?? undefined;
  const projectId = searchParams.get('project') ?? undefined;

  const repository = new PrismaPublicProductRepository(prisma);
  const useCase = new ListPublicProductsUseCase(repository);

  let result;
  try {
    result = await useCase.execute({
    creatorSlug: slug,
    page,
    limit: PAGE_SIZE,
      search,
      projectId,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (result.isFailure) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { products, total, pages } = result.value;

  return NextResponse.json(
    { products, total, pages, page },
    {
      headers: {
        // Cache 30s côté CDN — les produits publics ne changent pas à chaque seconde
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    }
  );
}
