export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { ListCreatorsUseCase } from '@/modules/analytics/application/use-cases';
import { PrismaCreatorRepository } from '@/modules/analytics/infrastructure/repositories';
import { prisma } from '@/lib/prisma/client';
import { CreatorsPageClient } from './page-client';
import type { CreatorSortField, CreatorStatus, SortDirection } from '@/modules/analytics/application/ports';

export const metadata: Metadata = {
  title: 'Gestion Createurs | Admin Kpsull',
  description: 'Gerez les createurs de la plateforme Kpsull',
};

interface CreatorsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: CreatorStatus;
    sortBy?: CreatorSortField;
    sortDirection?: SortDirection;
  }>;
}

/**
 * Admin Creators Page
 *
 * Story 11-2: Liste gestion createurs
 *
 * Page for admin to manage platform creators.
 *
 * Acceptance Criteria:
 * - AC1: Table des createurs avec infos (nom, email, date inscription, statut, CA)
 * - AC2: Filtres par statut (actif, suspendu)
 * - AC3: Recherche par nom/email
 * - AC4: Pagination
 */
export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  // Auth is handled by middleware (src/middleware.ts)
  // Parse search params
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search ?? '';
  const statusFilter: CreatorStatus | 'ALL' = params.status ?? 'ALL';
  const sortBy: CreatorSortField = params.sortBy ?? 'registeredAt';
  const sortDirection: SortDirection = params.sortDirection ?? 'desc';

  // Fetch creators with Prisma repository
  const creatorRepository = new PrismaCreatorRepository(prisma);
  const listCreatorsUseCase = new ListCreatorsUseCase(creatorRepository);

  const result = await listCreatorsUseCase.execute({
    page,
    pageSize: 10,
    search: search || undefined,
    statusFilter,
    sortBy,
    sortDirection,
  });

  if (result.isFailure) {
    return (
      <div className="container max-w-7xl py-6">
        <div className="text-center text-muted-foreground py-12">
          Une erreur est survenue lors du chargement des createurs.
        </div>
      </div>
    );
  }

  const { creators, total, totalPages } = result.value;

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des createurs
        </h1>
        <p className="text-muted-foreground">
          Gerez les createurs de la plateforme, suspendez ou reactivez leurs comptes
        </p>
      </div>

      {/* Creators table with client-side interactivity */}
      <CreatorsPageClient
        initialCreators={creators}
        initialTotal={total}
        initialPage={page}
        initialPageSize={10}
        initialTotalPages={totalPages}
        initialSortBy={sortBy}
        initialSortDirection={sortDirection}
        initialSearchQuery={search}
        initialStatusFilter={statusFilter}
      />
    </div>
  );
}
