import { Metadata } from 'next';
import { prisma } from '@/lib/prisma/client';
import { AdminStatsCards } from '@/components/admin';
import {
  GetAdminStatsUseCase,
  type GetAdminStatsOutput,
} from '@/modules/analytics/application/use-cases';
import { PrismaAdminAnalyticsRepository } from '@/modules/analytics/infrastructure/repositories';
import { RevenueChart, type MonthlyRevenue } from '@/components/dashboard/revenue-chart';

export const metadata: Metadata = {
  title: 'Revenus plateforme | Admin Kpsull',
  description: 'Analyse des revenus de la plateforme Kpsull',
};

const PAID_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as const;

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
}

function groupOrdersByMonth(
  orders: { totalAmount: number; createdAt: Date }[]
): MonthlyRevenue[] {
  const months = new Map<string, number>();

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.set(key, (months.get(key) ?? 0) + order.totalAmount);
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => {
      const [year = '2026', month = '01'] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: total / 100,
      };
    });
}

export default async function AdminRevenuePage() {
  const adminRepository = new PrismaAdminAnalyticsRepository(prisma);
  const statsUseCase = new GetAdminStatsUseCase(adminRepository);
  const statsResult = await statsUseCase.execute({ period: 'LAST_30_DAYS' });

  const revenueByCreator = await prisma.order.groupBy({
    by: ['creatorId'],
    where: { status: { in: [...PAID_STATUSES] } },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10,
  });

  const creatorIds = revenueByCreator.map((r) => r.creatorId);
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true, email: true },
  });

  const creatorsById = new Map(creators.map((c) => [c.id, c]));

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: twelveMonthsAgo },
      status: { in: [...PAID_STATUSES] },
    },
    select: { totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyChartData = groupOrdersByMonth(recentOrders);

  if (statsResult.isFailure) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">
            Erreur lors du chargement des statistiques: {statsResult.error}
          </p>
        </div>
      </div>
    );
  }

  const stats: GetAdminStatsOutput = statsResult.value!;

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
            totalOrders: stats.totalOrders,
            ordersChange: stats.ordersChange,
            newCreators: stats.newCreators,
            newCreatorsChange: stats.newCreatorsChange,
          }}
          currency="EUR"
        />

        <RevenueChart data={monthlyChartData} year={new Date().getFullYear()} />

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Top createurs par CA
          </h2>
          {revenueByCreator.length === 0 ? (
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
                  {revenueByCreator.map((row, index) => {
                    const creator = creatorsById.get(row.creatorId);
                    return (
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
                              {creator?.name ?? 'Inconnu'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {creator?.email ?? '-'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {row._count}
                        </td>
                        <td className="py-3 text-right font-medium tabular-nums">
                          {formatCurrency(row._sum.totalAmount ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
