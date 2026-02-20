import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ListProjectsUseCase } from '@/modules/products/application/use-cases/projects/list-projects.use-case';
import { PrismaProjectRepository } from '@/modules/products/infrastructure/repositories/prisma-project.repository';
import { NewProductPageClient } from './new-product-page-client';

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

  const projectRepo = new PrismaProjectRepository(prisma);
  const [collectionsResult, styles] = await Promise.all([
    new ListProjectsUseCase(projectRepo).execute({ creatorId: session.user.id }),
    prisma.style.findMany({
      where: {
        OR: [{ creatorId: null }, { creatorId: session.user.id }],
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isCustom: true },
    }),
  ]);

  const collections = (collectionsResult.value?.projects ?? []).map((p) => ({ id: p.id, name: p.name }));

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

      <NewProductPageClient collections={collections} styles={styles} />
    </div>
  );
}
