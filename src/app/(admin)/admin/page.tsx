import { Metadata } from 'next';
import { AdminStatsCards } from '@/components/admin';
import { AdminPeriodSelector } from './admin-period-selector';
import {
  GetAdminStatsUseCase,
  type GetAdminStatsOutput,
} from '@/modules/analytics/application/use-cases';
import { PrismaAdminAnalyticsRepository } from '@/modules/analytics/infrastructure/repositories';
import { prisma } from '@/lib/prisma/client';
import type { TimePeriodType } from '@/modules/analytics/domain/value-objects';

export const metadata: Metadata = {
  title: 'Dashboard Admin | Kpsull',
  description: 'Tableau de bord administrateur - KPIs plateforme',
};

interface AdminDashboardPageProps {
  searchParams: Promise<{
    period?: TimePeriodType;
  }>;
}

/**
 * Admin Dashboard Page
 *
 * Story 11-1: Dashboard admin KPIs
 *
 * Displays platform-wide KPIs for administrators:
 * - Total active creators
 * - Total platform revenue
 * - Total orders
 * - New creators this period
 *
 * Acceptance Criteria:
 * - AC1: KPIs plateforme (nombre createurs, CA total plateforme, commandes totales)
 * - AC2: Tendances vs periode precedente
 * - AC3: Page reservee aux ADMIN
 */
export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  // Auth is handled by middleware (src/middleware.ts)
  const params = await searchParams;
  const period: TimePeriodType = params.period ?? 'LAST_30_DAYS';

  // Initialize use case with Prisma repository
  const adminRepository = new PrismaAdminAnalyticsRepository(prisma);
  const getAdminStatsUseCase = new GetAdminStatsUseCase(adminRepository);

  // Execute use case
  const result = await getAdminStatsUseCase.execute({ period });

  // Handle error case
  if (result.isFailure) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            Erreur lors du chargement des statistiques: {result.error}
          </p>
        </div>
      </div>
    );
  }

  const stats: GetAdminStatsOutput = result.value!;

  return (
    <div className="container py-10">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard Admin
            </h1>
            <p className="text-muted-foreground">
              Vue d&apos;ensemble de la plateforme Kpsull
            </p>
          </div>

          {/* Period selector */}
          <AdminPeriodSelector currentPeriod={period} />
        </div>

        {/* KPI Cards - AC1 & AC2 */}
        <AdminStatsCards
          data={{
            totalCreators: stats.totalCreators,
            creatorsChange: stats.creatorsChange,
            totalPlatformRevenue: stats.totalPlatformRevenue,
            revenueChange: stats.revenueChange,
            totalOrders: stats.totalOrders,
            ordersChange: stats.ordersChange,
            newCreators: stats.newCreators,
            newCreatorsChange: stats.newCreatorsChange,
          }}
          currency="EUR"
        />
      </div>
    </div>
  );
}
