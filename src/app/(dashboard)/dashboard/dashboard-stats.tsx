import { prisma } from '@/lib/prisma/client';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart, type MonthlyRevenue } from '@/components/dashboard/revenue-chart';
import { GetCreatorOverviewUseCase } from '@/modules/analytics/application/use-cases';
import { PrismaCreatorOverviewRepository } from '@/modules/analytics/infrastructure/repositories';
import { DollarSign, Package, TrendingUp, Users } from 'lucide-react';

/** French short month labels indexed 0..11 */
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatCentsAsEur(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros) + ' EUR';
}

interface DashboardStatsProps {
  readonly creatorId: string;
}

export async function DashboardStats({ creatorId }: DashboardStatsProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();

  const overviewRepository = new PrismaCreatorOverviewRepository(prisma);
  const getOverviewUseCase = new GetCreatorOverviewUseCase(overviewRepository);
  const result = await getOverviewUseCase.execute({ creatorId, year: currentYear });

  if (result.isFailure) {
    return (
      <p className="text-destructive text-sm">
        Erreur lors du chargement des statistiques.
      </p>
    );
  }

  const stats = result.value;

  const revenueData: MonthlyRevenue[] = MONTH_LABELS.map((month, i) => {
    const point = stats.monthlyRevenue.find((p) => p.month === i);
    return { month, revenue: (point?.revenueCents ?? 0) / 100 };
  });

  const currentMonthRevenueCents =
    stats.monthlyRevenue.find((p) => p.month === currentMonthIndex)?.revenueCents ?? 0;

  return (
    <>
      <section aria-label="Statistiques" data-coach-mark="stats">
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Commandes" value={String(stats.totalOrders)} icon={Package} />
          <StatCard title="Chiffre d'affaires" value={formatCentsAsEur(stats.totalRevenueCents)} icon={DollarSign} />
          <StatCard title="Clients" value={String(stats.totalCustomers)} icon={Users} />
          <StatCard title="CA ce mois-ci" value={formatCentsAsEur(currentMonthRevenueCents)} icon={TrendingUp} />
        </div>
      </section>

      <section aria-label="Chiffre d'affaires" data-coach-mark="revenue">
        <RevenueChart data={revenueData} year={currentYear} />
      </section>
    </>
  );
}
