import { cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma/client';
import { auth } from '@/lib/auth';
import { GetPublicProductUseCase } from '@/modules/products/application/use-cases/public/get-public-product.use-case';
import { PrismaPublicProductRepository } from '@/modules/products/infrastructure/repositories/prisma-public-product.repository';
import { ProductDetail } from '@/components/products/product-detail';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

// Déduplique la query produit complète entre generateMetadata et la page dans le même rendu
const getProductForPage = cache(async (id: string) => {
  const repository = new PrismaPublicProductRepository(prisma);
  const useCase = new GetPublicProductUseCase(repository);
  return useCase.execute({ productId: id });
});

// Query légère pour les meta tags uniquement (server-cache-react — Vercel best practice 3.6)
const getProductMeta = cache(async (id: string) => {
  return prisma.product.findUnique({
    where: { id, status: 'PUBLISHED' },
    select: {
      name: true,
      description: true,
      variants: {
        take: 1,
        select: { images: true },
      },
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const product = await getProductMeta(id);

  if (!product) {
    return {
      title: 'Produit introuvable | Kpsull',
    };
  }

  const mainImage = (product.variants[0]?.images as string[] | null)?.[0];

  return {
    title: `${product.name} | Kpsull`,
    description: product.description ?? `Découvrez ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      type: 'website',
      siteName: 'Kpsull',
      ...(mainImage && { images: [{ url: mainImage, width: 800, height: 800, alt: product.name }] }),
    },
    twitter: {
      card: mainImage ? 'summary_large_image' : 'summary',
      title: product.name,
      description: product.description ?? undefined,
      ...(mainImage && { images: [mainImage] }),
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

  // Démarrer le produit et l'auth en parallèle (async-parallel — Vercel best practice 1.4)
  // auth() peut lever une erreur (token expiré/invalide) → catch gracieux pour éviter un crash
  const [result, session] = await Promise.all([getProductForPage(id), auth().catch(() => null)]);

  if (result.isFailure) {
    notFound();
  }

  const product = result.value;

  // Check if the current user is the creator of this product
  let isOwnProduct = false;

  if (session?.user?.id) {
    const creatorPage = await prisma.creatorPage.findUnique({
      where: { slug },
      select: { creatorId: true },
    });
    isOwnProduct = creatorPage?.creatorId === session.user.id;
  }

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
      creator={product.creator}
      creatorSlug={slug}
      isOwnProduct={isOwnProduct}
    />
  );
}
