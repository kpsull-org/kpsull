import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ProductForm } from '@/components/products/product-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nouveau produit | Kpsull',
  description: 'Creer un nouveau produit',
};

export default async function NewProductPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/mon-compte');
  }

  const collections = await prisma.project.findMany({
    where: { creatorId: session.user.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

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
        <h1 className="text-2xl font-bold tracking-tight">Nouveau produit</h1>
        <p className="text-muted-foreground">
          Creez un nouveau produit. Il sera en brouillon jusqu&apos;a sa publication.
        </p>
      </div>

      <div className="max-w-2xl">
        <ProductForm mode="create" collections={collections} />
      </div>
    </div>
  );
}
