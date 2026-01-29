import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { GetPublicProductUseCase } from '@/modules/products/application/use-cases/public/get-public-product.use-case';
import { PrismaPublicProductRepository } from '@/modules/products/infrastructure/repositories/prisma-public-product.repository';
import { ProductDetail } from '@/components/products/product-detail';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id, status: 'PUBLISHED' },
    select: { name: true, description: true },
  });

  if (!product) {
    return {
      title: 'Produit introuvable | Kpsull',
    };
  }

  return {
    title: `${product.name} | Kpsull`,
    description: product.description ?? `Découvrez ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
    },
  };
}

/**
 * Product Detail Page
 *
 * Story 6-3: Affichage details produit
 *
 * Acceptance Criteria:
 * - AC1: Affiche galerie d'images avec navigation
 * - AC2: Affiche nom, description, prix
 * - AC3: Sélecteur de variantes avec prix
 * - AC4: Bouton ajout au panier fonctionnel
 * - AC5: SEO avec meta tags et Open Graph
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug, id } = await params;

  const repository = new PrismaPublicProductRepository(prisma);
  const useCase = new GetPublicProductUseCase(repository);

  const result = await useCase.execute({ productId: id });

  if (result.isFailure) {
    notFound();
  }

  const product = result.value!;

  return (
    <ProductDetail
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        mainImageUrl: product.mainImageUrl,
        images: product.images,
        variants: product.variants,
      }}
      creatorSlug={slug}
    />
  );
}
