import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Prisma } from '@prisma/client';
import { CollectionsPageClient } from './page-client';

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
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role !== 'CREATOR' && dbUser?.role !== 'ADMIN') {
      redirect('/mon-compte');
    }
  }

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';

  const hasFilters = search !== '';

  const where: Prisma.ProjectWhereInput = { creatorId: session.user.id };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [collections, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Show empty state only when there are no collections AND no filters applied
  if (collections.length === 0 && !hasFilters) {
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

  const serializedCollections = collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    productCount: c._count.products,
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
