import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { ListCustomersUseCase } from '@/modules/analytics/application/use-cases/list-customers.use-case';
import { PrismaCustomerRepository } from '@/modules/analytics/infrastructure/repositories/prisma-customer.repository';
import { CustomersPageClient } from './page-client';
import type { CustomerSortField, SortDirection } from '@/modules/analytics/application/ports';

export const metadata: Metadata = {
  title: 'Clients | Kpsull',
  description: 'Consultez l\'historique de vos clients',
};

interface CustomersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: CustomerSortField;
    sortDirection?: SortDirection;
  }>;
}

/**
 * Customers Dashboard Page
 *
 * Story 10-3: Liste historique clients
 *
 * Page for creators to view their customer history.
 *
 * Acceptance Criteria:
 * - AC1: Liste des clients avec leurs commandes
 * - AC2: Tri par date, montant total, nombre de commandes
 * - AC3: Recherche par nom/email
 */
export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only creators and admins can access this page
  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';
  const sortBy: CustomerSortField = params.sortBy ?? 'lastOrderDate';
  const sortDirection: SortDirection = params.sortDirection ?? 'desc';

  // Fetch customers from real database
  const customerRepository = new PrismaCustomerRepository(prisma);
  const listCustomersUseCase = new ListCustomersUseCase(customerRepository);

  const result = await listCustomersUseCase.execute({
    creatorId: session.user.id,
    page,
    pageSize: 10,
    search: search || undefined,
    sortBy,
    sortDirection,
  });

  if (result.isFailure) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Une erreur est survenue lors du chargement des clients.
      </div>
    );
  }

  const { customers, total, totalPages } = result.value;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Historique clients
        </h1>
        <p className="text-muted-foreground">
          Consultez l&apos;historique de vos clients et leurs commandes
        </p>
      </div>

      {/* Customers table with client-side interactivity */}
      <CustomersPageClient
        initialCustomers={customers}
        initialTotal={total}
        initialPage={page}
        initialPageSize={10}
        initialTotalPages={totalPages}
        initialSortBy={sortBy}
        initialSortDirection={sortDirection}
        initialSearchQuery={search}
      />
    </div>
  );
}
