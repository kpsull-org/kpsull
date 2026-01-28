# Story 10.3: Liste et Historique Clients

Status: ready-for-dev

## Story

As a Createur,
I want voir la liste de mes clients et leur historique d'achats,
so that je puisse mieux connaitre mes acheteurs et personnaliser mes offres.

## Acceptance Criteria

1. **AC1 - Liste paginee des clients**
   - **Given** un Createur sur la page clients
   - **When** il consulte la liste
   - **Then** il voit une liste paginee avec: nom, email, nombre de commandes, CA total
   - **And** la liste est triable par chaque colonne
   - **And** 20 clients par page par defaut

2. **AC2 - Recherche et filtrage**
   - **Given** un Createur sur la page clients
   - **When** il utilise la barre de recherche
   - **Then** il peut chercher par nom ou email
   - **And** les resultats se mettent a jour en temps reel (debounce 300ms)

3. **AC3 - Detail client avec historique**
   - **Given** un Createur qui clique sur un client
   - **When** le detail s'affiche
   - **Then** il voit les informations du client
   - **And** l'historique complet de ses achats (date, produits, montant, statut)
   - **And** des statistiques: CA total, panier moyen, derniere commande

4. **AC4 - Respect RGPD**
   - **Given** les donnees clients affichees
   - **When** le Createur consulte un client
   - **Then** seules les donnees necessaires sont exposees
   - **And** l'email est partiellement masque dans la liste (j***@example.com)
   - **And** l'email complet est visible dans le detail

## Tasks / Subtasks

- [ ] **Task 1: Creer la page customers** (AC: #1, #2)
  - [ ] 1.1 Creer `src/app/(dashboard)/customers/page.tsx`
  - [ ] 1.2 Implementer la pagination serveur avec URL params
  - [ ] 1.3 Implementer le tri par colonne
  - [ ] 1.4 Ajouter la barre de recherche avec debounce

- [ ] **Task 2: Creer le composant CustomerList** (AC: #1)
  - [ ] 2.1 Creer `src/components/customers/customer-list.tsx`
  - [ ] 2.2 Utiliser DataTable avec colonnes configurables
  - [ ] 2.3 Afficher les metriques par client
  - [ ] 2.4 Masquer partiellement l'email

- [ ] **Task 3: Creer la page detail client** (AC: #3)
  - [ ] 3.1 Creer `src/app/(dashboard)/customers/[customerId]/page.tsx`
  - [ ] 3.2 Afficher les informations client
  - [ ] 3.3 Lister l'historique des commandes

- [ ] **Task 4: Creer le composant CustomerDetail** (AC: #3, #4)
  - [ ] 4.1 Creer `src/components/customers/customer-detail.tsx`
  - [ ] 4.2 Section statistiques (CA, panier moyen, derniere commande)
  - [ ] 4.3 Section historique commandes avec timeline

- [ ] **Task 5: Creer le service CustomersService** (AC: #1-3)
  - [ ] 5.1 Creer `src/modules/analytics/application/services/customers.service.ts`
  - [ ] 5.2 Implementer `getCustomers(creatorId, pagination, search)`
  - [ ] 5.3 Implementer `getCustomerDetail(customerId)`
  - [ ] 5.4 Aggreger les stats par client

- [ ] **Task 6: Creer les requetes optimisees** (AC: #1-3)
  - [ ] 6.1 Requete customers avec agregats (COUNT, SUM)
  - [ ] 6.2 Index sur (creatorId, email) pour recherche
  - [ ] 6.3 Requete historique commandes

- [ ] **Task 7: Ecrire les tests** (AC: #1-4)
  - [ ] 7.1 Tests unitaires CustomersService
  - [ ] 7.2 Tests composants CustomerList, CustomerDetail
  - [ ] 7.3 Tests pagination et recherche

## Dev Notes

### Page Customers

```typescript
// src/app/(dashboard)/customers/page.tsx
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { CustomerList } from '@/components/customers/customer-list';
import { CustomerListSkeleton } from '@/components/customers/customer-list-skeleton';
import { SearchInput } from '@/components/ui/search-input';

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.creatorId) {
    redirect('/become-creator');
  }

  const page = parseInt(searchParams.page ?? '1');
  const search = searchParams.search ?? '';
  const sort = searchParams.sort ?? 'totalSpent';
  const order = searchParams.order ?? 'desc';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Gerez vos clients et consultez leur historique
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Rechercher par nom ou email..."
          className="max-w-sm"
        />
      </div>

      <Suspense fallback={<CustomerListSkeleton />}>
        <CustomerList
          creatorId={session.user.creatorId}
          page={page}
          search={search}
          sort={sort}
          order={order}
        />
      </Suspense>
    </div>
  );
}
```

### Composant CustomerList

```typescript
// src/components/customers/customer-list.tsx
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SortableHeader } from '@/components/ui/sortable-header';
import { container } from '@/lib/container';
import { CustomersService } from '@/modules/analytics/application/services/customers.service';
import { formatCurrency, maskEmail } from '@/lib/utils';

interface CustomerListProps {
  creatorId: string;
  page: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
}

export async function CustomerList({
  creatorId,
  page,
  search,
  sort,
  order,
}: CustomerListProps) {
  const service = container.resolve(CustomersService);
  const { customers, totalCount, totalPages } = await service.getCustomers({
    creatorId,
    page,
    pageSize: 20,
    search,
    sortBy: sort,
    sortOrder: order,
  });

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {search ? 'Aucun client trouve pour cette recherche' : 'Aucun client pour le moment'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name">Nom</SortableHeader>
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>
              <SortableHeader field="ordersCount">Commandes</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="totalSpent">CA Total</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="lastOrderAt">Derniere commande</SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Link
                  href={`/customers/${customer.id}`}
                  className="font-medium hover:underline"
                >
                  {customer.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {maskEmail(customer.email)}
              </TableCell>
              <TableCell>{customer.ordersCount}</TableCell>
              <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
              <TableCell>
                {customer.lastOrderAt
                  ? new Date(customer.lastOrderAt).toLocaleDateString('fr-FR')
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination currentPage={page} totalPages={totalPages} totalCount={totalCount} />
    </div>
  );
}
```

### Page Detail Client

```typescript
// src/app/(dashboard)/customers/[customerId]/page.tsx
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { CustomerDetail } from '@/components/customers/customer-detail';
import { CustomerOrderHistory } from '@/components/customers/customer-order-history';
import { container } from '@/lib/container';
import { CustomersService } from '@/modules/analytics/application/services/customers.service';

interface PageProps {
  params: { customerId: string };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.creatorId) {
    redirect('/become-creator');
  }

  const service = container.resolve(CustomersService);
  const customer = await service.getCustomerDetail(
    params.customerId,
    session.user.creatorId
  );

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CustomerDetail customer={customer} />
      <CustomerOrderHistory orders={customer.orders} />
    </div>
  );
}
```

### Composant CustomerDetail

```typescript
// src/components/customers/customer-detail.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatsCard } from '@/components/dashboard/stats-card';
import { formatCurrency } from '@/lib/utils';
import { Mail, ShoppingCart, Calendar, DollarSign } from 'lucide-react';

interface CustomerDetailProps {
  customer: {
    id: string;
    name: string;
    email: string;
    image?: string;
    ordersCount: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderAt: Date;
    lastOrderAt: Date;
  };
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={customer.image} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {customer.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="CA Total"
          value={formatCurrency(customer.totalSpent)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Commandes"
          value={customer.ordersCount.toString()}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Panier moyen"
          value={formatCurrency(customer.averageOrderValue)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Derniere commande"
          value={new Date(customer.lastOrderAt).toLocaleDateString('fr-FR')}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}
```

### Service Customers

```typescript
// src/modules/analytics/application/services/customers.service.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

export interface GetCustomersParams {
  creatorId: string;
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomersService {
  async getCustomers(params: GetCustomersParams) {
    const { creatorId, page, pageSize, search, sortBy = 'totalSpent', sortOrder = 'desc' } = params;

    const skip = (page - 1) * pageSize;

    // Sous-requete pour obtenir les stats par client
    const customersWithStats = await prisma.$queryRaw<CustomerSummary[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(o.id)::int as "ordersCount",
        COALESCE(SUM(o."totalAmount"), 0)::float as "totalSpent",
        MAX(o."createdAt") as "lastOrderAt"
      FROM "User" u
      INNER JOIN "Order" o ON o."customerId" = u.id
      WHERE o."creatorId" = ${creatorId}
        AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
        ${search ? Prisma.sql`AND (u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})` : Prisma.empty}
      GROUP BY u.id
      ORDER BY ${Prisma.raw(`"${sortBy}"`)} ${Prisma.raw(sortOrder.toUpperCase())}
      LIMIT ${pageSize}
      OFFSET ${skip}
    `;

    const totalCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT u.id) as count
      FROM "User" u
      INNER JOIN "Order" o ON o."customerId" = u.id
      WHERE o."creatorId" = ${creatorId}
        AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
        ${search ? Prisma.sql`AND (u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})` : Prisma.empty}
    `;

    const total = Number(totalCount[0].count);

    return {
      customers: customersWithStats,
      totalCount: total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getCustomerDetail(customerId: string, creatorId: string) {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!customer) return null;

    const stats = await prisma.order.aggregate({
      where: {
        customerId,
        creatorId,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    const orders = await prisma.order.findMany({
      where: {
        customerId,
        creatorId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
    });

    const totalSpent = stats._sum.totalAmount?.toNumber() ?? 0;
    const ordersCount = stats._count.id;

    return {
      ...customer,
      ordersCount,
      totalSpent,
      averageOrderValue: ordersCount > 0 ? totalSpent / ordersCount : 0,
      firstOrderAt: stats._min.createdAt!,
      lastOrderAt: stats._max.createdAt!,
      orders,
    };
  }
}
```

### Utility maskEmail

```typescript
// Dans src/lib/utils.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}
```

### References

- [Source: architecture.md#Analytics Module]
- [Source: prd.md#FR16]
- [Source: epics.md#Story 10.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
