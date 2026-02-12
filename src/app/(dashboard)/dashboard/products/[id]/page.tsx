import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ProductForm } from '@/components/products/product-form';
import { ProductActions } from './product-actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

  const product = await prisma.product.findUnique({
    where: { id, creatorId: session.user.id },
  });

  if (!product) {
    notFound();
  }

  const collections = await prisma.project.findMany({
    where: { creatorId: session.user.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

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

      <div className="max-w-2xl">
        <ProductForm
          mode="edit"
          productId={product.id}
          initialValues={{
            name: product.name,
            description: product.description ?? undefined,
            price: product.price,
            projectId: product.projectId ?? undefined,
          }}
          collections={collections}
        />
      </div>
    </div>
  );
}
