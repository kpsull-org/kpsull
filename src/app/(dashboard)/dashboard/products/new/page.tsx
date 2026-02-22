import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreateProductUseCase } from '@/modules/products/application/use-cases/products/create-product.use-case';
import { PrismaProductRepository } from '@/modules/products/infrastructure/repositories/prisma-product.repository';

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

  const productRepository = new PrismaProductRepository(prisma);
  const createProductUseCase = new CreateProductUseCase(productRepository);

  const result = await createProductUseCase.execute({
    creatorId: session.user.id,
    name: 'Nouveau produit',
    price: 0.01,
  });

  if (result.isFailure) {
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
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            Une erreur est survenue lors de la creation du produit.
          </p>
          <p className="text-xs text-destructive/70 mt-1">{result.error}</p>
        </div>
      </div>
    );
  }

  redirect(`/dashboard/products/${result.value.id}`);
}
