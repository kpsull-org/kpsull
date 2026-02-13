export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { ListAdminClientsUseCase } from '@/modules/analytics/application/use-cases';
import { PrismaAdminClientRepository } from '@/modules/analytics/infrastructure/repositories';
import { ClientsPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Tous les clients | Admin Kpsull',
  description: 'Gerez tous les clients de la plateforme',
};

interface ClientsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

const PAGE_SIZE = 10;

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const search = params.search?.trim() ?? '';

  const clientRepository = new PrismaAdminClientRepository(prisma);
  const listClientsUseCase = new ListAdminClientsUseCase(clientRepository);

  const result = await listClientsUseCase.execute({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  if (result.isFailure) {
    return (
      <div className="container max-w-7xl py-6">
        <p className="text-destructive">Erreur: {result.error}</p>
      </div>
    );
  }

  const { clients, total, totalPages } = result.value;

  const serializedClients = clients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    city: client.city,
    orderCount: client.orderCount,
    createdAt: client.createdAt.toISOString(),
  }));

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des clients
        </h1>
        <p className="text-muted-foreground">
          Tous les clients inscrits sur la plateforme
        </p>
      </div>

      <ClientsPageClient
        clients={serializedClients}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        searchQuery={search}
      />
    </div>
  );
}
