import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { CollectionDetail } from './collection-detail';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PrismaProjectRepository } from '@/modules/products/infrastructure/repositories/prisma-project.repository';
import { PrismaProductRepository } from '@/modules/products/infrastructure/repositories/prisma-product.repository';

export const metadata: Metadata = {
  title: 'Detail collection | Kpsull',
  description: 'Modifier votre collection',
};

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/mon-compte');
  }

  const { id } = await params;

  const projectRepo = new PrismaProjectRepository(prisma);
  const productRepo = new PrismaProductRepository(prisma);

  const collection = await projectRepo.findById(id);

  if (!collection || collection.creatorId !== session.user.id) {
    notFound();
  }

  // Fetch collection products and unassigned products in parallel
  const [collectionProducts, unassignedProductsList] = await Promise.all([
    productRepo.findByCreatorId(session.user.id, { projectId: id }),
    productRepo.findByCreatorId(session.user.id),
  ]);

  // Filter unassigned products (no projectId)
  const unassignedProducts = unassignedProductsList.filter((p) => !p.projectId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux collections
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
      </div>

      <CollectionDetail
        collection={{
          id: collection.idString,
          name: collection.name,
          description: collection.description ?? null,
        }}
        products={collectionProducts.map((p) => ({
          id: p.idString,
          name: p.name,
          price: p.price.amount,
          status: p.status.value,
        }))}
        unassignedProducts={unassignedProducts.map((p) => ({
          id: p.idString,
          name: p.name,
          price: p.price.amount,
          status: p.status.value,
        }))}
      />
    </div>
  );
}
