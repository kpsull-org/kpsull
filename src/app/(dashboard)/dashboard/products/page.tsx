import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ShoppingBag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Prisma, ProductStatus } from '@prisma/client';
import { ProductsPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Produits | Kpsull',
  description: 'Gerez vos produits',
};

const PAGE_SIZE = 10;

const VALID_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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
  const statusFilter = params.status;
  const statusValue = VALID_STATUSES.includes(statusFilter as ProductStatus)
    ? (statusFilter as ProductStatus)
    : undefined;

  const hasFilters = search !== '' || statusFilter !== undefined;

  // Build where clause
  const where: Prisma.ProductWhereInput = { creatorId: session.user.id };

  if (statusValue) {
    where.status = statusValue;
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        _count: { select: { variants: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Show empty state only when there are no products AND no filters applied
  if (products.length === 0 && !hasFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground">
              Gerez votre catalogue de produits.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/dashboard/products/new">
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Link>
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Aucun produit</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Ajoutez votre premier produit pour commencer a vendre sur Kpsull.
              Vous pourrez definir les prix, les variantes et les photos.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href="/dashboard/products/new">
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const serializedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    status: product.status,
    variantCount: product._count.variants,
    createdAt: product.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">
            Gerez votre catalogue de produits.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/products/new">
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      <ProductsPageClient
        products={serializedProducts}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        searchQuery={search}
        statusFilter={statusFilter}
      />
    </div>
  );
}
