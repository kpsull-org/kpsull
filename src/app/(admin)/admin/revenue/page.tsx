export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma/client';
import { AdminStatsCards } from '@/components/admin';
import {
  GetAdminStatsUseCase,
  type GetAdminStatsOutput,
  GetAdminMonthlyRevenueUseCase,
  GetAdminRevenueByCreatorUseCase,
} from '@/modules/analytics/application/use-cases';
import { PrismaAdminAnalyticsRepository } from '@/modules/analytics/infrastructure/repositories';
import { RevenueChart, type MonthlyRevenue } from '@/components/dashboard/revenue-chart';

/** Cache revenue analytics for 5 minutes to avoid repeated DB/Stripe calls */
const getCachedRevenueStats = unstable_cache(
  async (period: string, year: number) => {
    const repo = new PrismaAdminAnalyticsRepository(prisma);
    const [statsResult, monthlyResult, creatorsResult] = await Promise.all([
      new GetAdminStatsUseCase(repo).execute({ period: period as 'LAST_30_DAYS' }),
      new GetAdminMonthlyRevenueUseCase(repo).execute({ year }),
      new GetAdminRevenueByCreatorUseCase(repo).execute({ limit: 10 }),
    ]);
    return {
      stats: statsResult.isSuccess ? statsResult.value : null,
      monthly: monthlyResult.isSuccess ? monthlyResult.value : null,
      creators: creatorsResult.isSuccess ? creatorsResult.value : null,
    };
  },
  ['admin-revenue-stats'],
  { revalidate: 300, tags: ['admin-stats'] }
);

export const metadata: Metadata = {
  title: 'Revenus plateforme | Admin Kpsull',
  description: 'Analyse des revenus de la plateforme Kpsull',
};

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
}

export default async function AdminRevenuePage() {
  const currentYear = new Date().getFullYear();

  // Use 5-min cache to avoid repeated DB calls on each visit
  const { stats: statsValue, monthly: monthlyValue, creators: creatorsValue } =
    await getCachedRevenueStats('LAST_30_DAYS', currentYear);

  const monthlyChartData: MonthlyRevenue[] = monthlyValue
    ? MONTH_LABELS.map((month, i) => {
        const point = monthlyValue.revenueByMonth.find((p) => p.month === i);
        return {
          month,
          revenue: (point?.revenue ?? 0) / 100,
          commissions: (point?.commissions ?? 0) / 100,
          subscriptions: (point?.subscriptions ?? 0) / 100,
        };
      })
    : [];

  const creatorRows = creatorsValue?.creators ?? [];

  if (!statsValue) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            Erreur lors du chargement des statistiques.
          </p>
        </div>
      </div>
    );
  }

  const stats: GetAdminStatsOutput = statsValue;

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Revenus plateforme
          </h1>
          <p className="text-muted-foreground">
            Analyse detaillee des revenus Kpsull
          </p>
        </div>

        <AdminStatsCards
          data={{
            totalCreators: stats.totalCreators,
            creatorsChange: stats.creatorsChange,
            totalPlatformRevenue: stats.totalPlatformRevenue,
            revenueChange: stats.revenueChange,
            subscriptionRevenue: stats.subscriptionRevenue,
            commissionRevenue: stats.commissionRevenue,
            totalOrders: stats.totalOrders,
            ordersChange: stats.ordersChange,
            newCreators: stats.newCreators,
            newCreatorsChange: stats.newCreatorsChange,
          }}
          currency="EUR"
        />

        <RevenueChart data={monthlyChartData} year={currentYear} />

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Top createurs par CA
          </h2>
          {creatorRows.length === 0 ? (
            <p className="text-muted-foreground">
              Aucune donnee de createur disponible.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Createur</th>
                    <th className="pb-3 pr-4 text-right font-medium">
                      Commandes
                    </th>
                    <th className="pb-3 text-right font-medium">CA total</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorRows.map((row, index) => (
                    <tr
                      key={row.creatorId}
                      className="border-b last:border-0"
                    >
                      <td className="py-3 pr-4 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">
                            {row.creatorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.creatorEmail || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {row.orderCount}
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums">
                        {formatCurrency(row.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
