import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { CollectionDetail } from './collection-detail';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

  const collection = await prisma.project.findUnique({
    where: { id, creatorId: session.user.id },
    include: {
      products: {
        select: { id: true, name: true, price: true, status: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  const unassignedProducts = await prisma.product.findMany({
    where: {
      creatorId: session.user.id,
      projectId: null,
    },
    select: { id: true, name: true, price: true, status: true },
    orderBy: { name: 'asc' },
  });

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
          id: collection.id,
          name: collection.name,
          description: collection.description,
        }}
        products={collection.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          status: p.status,
        }))}
        unassignedProducts={unassignedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          status: p.status,
        }))}
      />
    </div>
  );
}
