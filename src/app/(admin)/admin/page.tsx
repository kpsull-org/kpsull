export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { Package, Store, Users, DollarSign, ArrowRight } from 'lucide-react';
import { AdminStatsCards } from '@/components/admin';
import {
  GetAdminStatsUseCase,
  type GetAdminStatsOutput,
  GetAdminMonthlyRevenueUseCase,
} from '@/modules/analytics/application/use-cases';
import { PrismaAdminAnalyticsRepository } from '@/modules/analytics/infrastructure/repositories';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import { RevenueChart, type MonthlyRevenue } from '@/components/dashboard/revenue-chart';
import { Card, CardContent } from '@/components/ui/card';

/** Cache admin stats for 5 minutes to avoid repeated Stripe calls */
const getCachedAdminStats = unstable_cache(
  async (period: string) => {
    const repo = new PrismaAdminAnalyticsRepository(prisma, stripe);
    const result = await new GetAdminStatsUseCase(repo).execute({ period: period as 'THIS_MONTH' | 'LAST_30_DAYS' });
    return result.isSuccess ? result.value : null;
  },
  ['admin-stats'],
  { revalidate: 300, tags: ['admin-stats'] }
);

const getCachedMonthlyRevenue = unstable_cache(
  async (year: number) => {
    const repo = new PrismaAdminAnalyticsRepository(prisma, stripe);
    const result = await new GetAdminMonthlyRevenueUseCase(repo).execute({ year });
    return result.isSuccess ? result.value : null;
  },
  ['admin-monthly-revenue'],
  { revalidate: 300, tags: ['admin-stats'] }
);

export const metadata: Metadata = {
  title: 'Dashboard Admin | Kpsull',
  description: 'Tableau de bord administrateur - KPIs plateforme',
};

/** French short month labels indexed 0..11 */
const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Map month index (0–11) from the use case to a MonthlyRevenue chart entry */
function toMonthlyRevenue(
  dataPoints: { month: number; revenue: number; commissions: number; subscriptions: number }[]
): MonthlyRevenue[] {
  return MONTH_LABELS.map((month, i) => {
    const point = dataPoints.find((p) => p.month === i);
    return {
      month,
      revenue: (point?.revenue ?? 0) / 100,
      commissions: (point?.commissions ?? 0) / 100,
      subscriptions: (point?.subscriptions ?? 0) / 100,
    };
  });
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
 * - Annual revenue chart
 * - Quick action links to admin sub-pages
 *
 * Acceptance Criteria:
 * - AC1: KPIs plateforme (nombre createurs, CA total plateforme, commandes totales)
 * - AC2: Tendances vs periode precedente
 * - AC3: Page reservee aux ADMIN
 */
export default async function AdminDashboardPage() {
  // Auth is handled by middleware (src/middleware.ts)
  const currentYear = new Date().getFullYear();

  // Run stats and revenue in parallel, using 5-min cache to avoid repeated Stripe calls
  const [statsValue, revenueValue] = await Promise.all([
    getCachedAdminStats('THIS_MONTH'),
    getCachedMonthlyRevenue(currentYear),
  ]);

  const revenueData = revenueValue
    ? toMonthlyRevenue(revenueValue.revenueByMonth)
    : MONTH_LABELS.map((month) => ({ month, revenue: 0, commissions: 0, subscriptions: 0 }));

  // Handle error case
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de la plateforme Kpsull
          </p>
        </div>

        {/* KPI Cards — mois en cours */}
        <section aria-label="KPIs du mois en cours">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Ce mois-ci
          </h2>
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
        </section>

        {/* Revenue Chart */}
        <section aria-label="Chiffre d'affaires annuel">
          <RevenueChart data={revenueData} year={currentYear} />
        </section>

        {/* Quick Actions */}
        <section aria-label="Acces rapide">
          <h2 className="text-lg font-semibold tracking-tight mb-5">
            Acces rapide
          </h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Commandes"
              description="Consultez et gerez toutes les commandes de la plateforme"
              href="/admin/orders"
              icon={Package}
            />
            <QuickActionCard
              title="Createurs"
              description="Gerez les createurs et leurs boutiques"
              href="/admin/creators"
              icon={Store}
            />
            <QuickActionCard
              title="Clients"
              description="Consultez la liste des clients de la plateforme"
              href="/admin/clients"
              icon={Users}
            />
            <QuickActionCard
              title="Revenus"
              description="Analyse detaillee des revenus par createur"
              href="/admin/revenue"
              icon={DollarSign}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QuickActionCard (local component, mirrors dashboard pattern)      */
/* ------------------------------------------------------------------ */

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: QuickActionCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-snug">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
