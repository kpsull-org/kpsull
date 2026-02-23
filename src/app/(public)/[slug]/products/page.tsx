import { cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { ListPublicProductsUseCase } from '@/modules/products/application/use-cases/public/list-public-products.use-case';
import { PrismaPublicProductRepository } from '@/modules/products/infrastructure/repositories/prisma-public-product.repository';
import { InfiniteProductGrid } from '@/components/products/infinite-product-grid';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; project?: string }>;
}

const PRODUCTS_PER_PAGE = 12;

// Déduplique la query entre generateMetadata et la page dans le même rendu (Vercel best practice 3.6)
const getCreatorPageMeta = cache(async (slug: string) => {
  return prisma.creatorPage.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const page = await getCreatorPageMeta(slug);

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
 * - AC1: Affiche la grille de produits du créateur (page 1 en SSR)
 * - AC2: Infinite scroll — chargement progressif via Intersection Observer
 * - AC3: Recherche par nom/description
 * - AC4: Filtre par projet (optionnel)
 * - AC5: SEO avec meta tags
 */
export default async function ProductsCatalogPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { search, project } = await searchParams;

  const repository = new PrismaPublicProductRepository(prisma);
  const useCase = new ListPublicProductsUseCase(repository);

  const result = await useCase.execute({
    creatorSlug: slug,
    page: 1,
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
        <p className="mt-2 text-muted-foreground">
          {total} produit{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
        </p>
      </div>

      <InfiniteProductGrid
        initialProducts={products}
        initialPage={1}
        totalPages={pages}
        slug={slug}
        search={search}
        projectId={project}
      />
    </div>
  );
}
