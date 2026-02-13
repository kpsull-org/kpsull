import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CollectionsPageClient } from './page-client';
import { ListProjectsUseCase } from '@/modules/products/application/use-cases/projects/list-projects.use-case';
import { PrismaProjectRepository } from '@/modules/products/infrastructure/repositories/prisma-project.repository';

export const metadata: Metadata = {
  title: 'Collections | Kpsull',
  description: 'Gerez vos collections de produits',
};

const PAGE_SIZE = 10;

interface CollectionsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/mon-compte');
  }

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';
  const hasFilters = search !== '';

  const projectRepo = new PrismaProjectRepository(prisma);
  const result = await new ListProjectsUseCase(projectRepo).execute({ creatorId: session.user.id });

  let allCollections = result.value?.projects ?? [];

  // Apply search filter (ListProjectsUseCase doesn't support search natively)
  if (search) {
    allCollections = allCollections.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = allCollections.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginatedCollections = allCollections.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Show empty state only when there are no collections AND no filters applied
  if (paginatedCollections.length === 0 && !hasFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
            <p className="text-muted-foreground">
              Organisez vos produits en collections thematiques.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/dashboard/collections/new">
              <Plus className="h-4 w-4" />
              Nouvelle collection
            </Link>
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Aucune collection</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Creez votre premiere collection pour organiser vos produits et les
              presenter de maniere attractive a vos clients.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href="/dashboard/collections/new">
                <Plus className="h-4 w-4" />
                Creer une collection
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const serializedCollections = paginatedCollections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    productCount: c.productCount,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organisez vos produits en collections thematiques.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/collections/new">
            <Plus className="h-4 w-4" />
            Nouvelle collection
          </Link>
        </Button>
      </div>

      <CollectionsPageClient
        collections={serializedCollections}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        searchQuery={search}
      />
    </div>
  );
}
