import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ProductForm } from '@/components/products/product-form';
import { ProductActions } from './product-actions';
import { VariantManager } from './variant-manager';
import { ImageManager } from './image-manager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GetProductDetailUseCase } from '@/modules/products/application/use-cases/products/get-product-detail.use-case';
import { ListProjectsUseCase } from '@/modules/products/application/use-cases/projects/list-projects.use-case';
import { ListVariantsUseCase } from '@/modules/products/application/use-cases/variants/list-variants.use-case';
import { PrismaProductRepository } from '@/modules/products/infrastructure/repositories/prisma-product.repository';
import { PrismaProjectRepository } from '@/modules/products/infrastructure/repositories/prisma-project.repository';
import { PrismaVariantRepository } from '@/modules/products/infrastructure/repositories/prisma-variant.repository';
import { PrismaProductImageRepository } from '@/modules/products/infrastructure/repositories/prisma-product-image.repository';

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

  const [productResult, collectionsResult, variantsResult, images] = await Promise.all([
    new GetProductDetailUseCase(productRepo).execute({ productId: id, creatorId: session.user.id }),
    new ListProjectsUseCase(projectRepo).execute({ creatorId: session.user.id }),
    new ListVariantsUseCase(variantRepo, productRepo).execute({ productId: id }),
    imageRepo.findByProductId(id),
  ]);

  if (productResult.isFailure || !productResult.value) {
    notFound();
  }

  const product = productResult.value;
  const collections = (collectionsResult.value?.projects ?? []).map((p) => ({ id: p.id, name: p.name }));
  const variants = (variantsResult.value?.variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    priceOverride: v.priceOverride ? Math.round(v.priceOverride * 100) : undefined,
    stock: v.stock,
    isAvailable: v.isAvailable,
  }));
  const imageData = images.map((img) => ({
    id: img.idString,
    url: img.url.url,
    alt: img.alt,
    position: img.position,
  }));

  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publie',
    ARCHIVED: 'Archive',
  };

  const statusBadgeClasses: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProductForm
            mode="edit"
            productId={product.id}
            initialValues={{
              name: product.name,
              description: product.description,
              price: product.price,
              projectId: product.projectId,
            }}
            collections={collections}
          />

          <VariantManager productId={product.id} variants={variants} />
        </div>

        <div className="space-y-6">
          <ImageManager productId={product.id} images={imageData} />
        </div>
      </div>
    </div>
  );
}
