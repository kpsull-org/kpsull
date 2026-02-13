import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { ListPublicProductsUseCase } from '@/modules/products/application/use-cases/public/list-public-products.use-case';
import { PrismaPublicProductRepository } from '@/modules/products/infrastructure/repositories/prisma-public-product.repository';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductsPagination } from '@/components/products/products-pagination';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string; project?: string }>;
}

const PRODUCTS_PER_PAGE = 12;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const page = await prisma.creatorPage.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!page) {
    return {
      title: 'Boutique introuvable | Kpsull',
    };
  }

  return {
    title: `Produits - ${page.title} | Kpsull`,
    description: page.description ?? `Découvrez les produits de ${page.title}`,
  };
}

/**
 * Products Catalog Page
 *
 * Story 6-2: Parcours catalogue produits
 *
 * Acceptance Criteria:
 * - AC1: Affiche la grille de produits du créateur
 * - AC2: Pagination fonctionnelle
 * - AC3: Recherche par nom/description
 * - AC4: Filtre par projet (optionnel)
 * - AC5: SEO avec meta tags
 */
export default async function ProductsCatalogPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam, search, project } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));

  const repository = new PrismaPublicProductRepository(prisma);
  const useCase = new ListPublicProductsUseCase(repository);

  const result = await useCase.execute({
    creatorSlug: slug,
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    search: search,
    projectId: project,
  });

  if (result.isFailure) {
    notFound();
  }

  const { products, total, pages } = result.value;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nos produits</h1>
        <p className="text-muted-foreground mt-2">
          {total} produit{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
        </p>
      </div>

      <ProductGrid products={products} creatorSlug={slug} />

      <ProductsPagination
        currentPage={currentPage}
        totalPages={pages}
        baseUrl={`/${slug}/products`}
      />
    </div>
  );
}
