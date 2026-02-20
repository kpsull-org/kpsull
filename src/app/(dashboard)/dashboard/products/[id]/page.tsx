import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ProductActions } from './product-actions';
import { ProductDetailClient } from './product-detail-client';
import { parseSizes } from '@/lib/utils/parse-sizes';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GetProductDetailUseCase } from '@/modules/products/application/use-cases/products/get-product-detail.use-case';
import { ListProjectsUseCase } from '@/modules/products/application/use-cases/projects/list-projects.use-case';
import { ListVariantsUseCase } from '@/modules/products/application/use-cases/variants/list-variants.use-case';
import { PrismaProductRepository } from '@/modules/products/infrastructure/repositories/prisma-product.repository';
import { PrismaProjectRepository } from '@/modules/products/infrastructure/repositories/prisma-project.repository';
import { PrismaVariantRepository } from '@/modules/products/infrastructure/repositories/prisma-variant.repository';
import { PrismaProductImageRepository } from '@/modules/products/infrastructure/repositories/prisma-product-image.repository';
import type { SkuOutput } from '../actions';

export const metadata: Metadata = {
  title: 'Detail produit | Kpsull',
  description: 'Modifier votre produit',
};

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/mon-compte');
  }

  const { id } = await params;

  const productRepo = new PrismaProductRepository(prisma);
  const projectRepo = new PrismaProjectRepository(prisma);
  const variantRepo = new PrismaVariantRepository(prisma);
  const imageRepo = new PrismaProductImageRepository(prisma);

  const [productResult, collectionsResult, variantsResult, images, productExtra, styles, rawSkus] =
    await Promise.all([
      new GetProductDetailUseCase(productRepo).execute({ productId: id, creatorId: session.user.id }),
      new ListProjectsUseCase(projectRepo).execute({ creatorId: session.user.id }),
      new ListVariantsUseCase(variantRepo, productRepo).execute({ productId: id }),
      imageRepo.findByProductId(id),
      prisma.product.findUnique({
        where: { id },
        select: {
          styleId: true,
          sizes: true,
          category: true,
          gender: true,
          materials: true,
          fit: true,
          season: true,
          madeIn: true,
          careInstructions: true,
          certifications: true,
          weight: true,
        },
      }),
      prisma.style.findMany({
        where: {
          OR: [
            { isCustom: false, status: 'APPROVED' },
            { isCustom: true, creatorId: session.user.id, status: 'PENDING_APPROVAL' },
            { isCustom: true, creatorId: session.user.id, status: 'APPROVED' },
          ],
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, isCustom: true, status: true },
      }),
      prisma.productSku.findMany({
        where: { productId: id },
        orderBy: [{ variantId: 'asc' }, { size: 'asc' }],
      }),
    ]);

  if (productResult.isFailure || !productResult.value) {
    notFound();
  }

  const product = productResult.value;
  const collections = (collectionsResult.value?.projects ?? []).map((p) => ({ id: p.id, name: p.name }));

  const variants = (variantsResult.value?.variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    priceOverride: v.priceOverride ? Math.round(v.priceOverride * 100) : undefined,
    color: v.color,
    colorCode: v.colorCode,
    images: v.images,
  }));

  const imageData = images.map((img) => ({
    id: img.idString,
    url: img.url.url,
    alt: img.alt,
    position: img.position,
  }));

  const initialSizes = parseSizes(productExtra?.sizes);

  const initialSkus: SkuOutput[] = rawSkus.map((s) => ({
    id: s.id,
    productId: s.productId,
    variantId: s.variantId ?? undefined,
    size: s.size ?? undefined,
    stock: s.stock,
  }));

  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publie',
    ARCHIVED: 'Archive',
  };

  const statusBadgeClasses: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux produits
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses[product.status] ?? 'bg-gray-100 text-gray-800'}`}
            >
              {statusLabels[product.status] ?? product.status}
            </span>
          </div>
          <ProductActions productId={product.id} status={product.status} />
        </div>
      </div>

      <ProductDetailClient
        productId={product.id}
        initialFormValues={{
          name: product.name,
          description: product.description,
          price: product.price,
          projectId: product.projectId,
          styleId: productExtra?.styleId ?? undefined,
          category: productExtra?.category ?? undefined,
          gender: productExtra?.gender ?? undefined,
          materials: productExtra?.materials ?? undefined,
          fit: productExtra?.fit ?? undefined,
          season: productExtra?.season ?? undefined,
          madeIn: productExtra?.madeIn ?? undefined,
          careInstructions: productExtra?.careInstructions ?? undefined,
          certifications: productExtra?.certifications ?? undefined,
          weight: productExtra?.weight ?? undefined,
        }}
        collections={collections}
        styles={styles}
        initialVariants={variants}
        initialSizes={initialSizes}
        initialSkus={initialSkus}
        initialProductImages={imageData}
      />
    </div>
  );
}
