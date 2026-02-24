export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Package, Store, Users, DollarSign, ArrowRight } from 'lucide-react';
import { AdminStatsCards } from '@/components/admin';
import { AdminPeriodSelector } from './admin-period-selector';
import {
  GetAdminStatsUseCase,
  type GetAdminStatsOutput,
  GetAdminMonthlyRevenueUseCase,
} from '@/modules/analytics/application/use-cases';
import { PrismaAdminAnalyticsRepository } from '@/modules/analytics/infrastructure/repositories';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import type { TimePeriodType } from '@/modules/analytics/domain/value-objects';
import { RevenueChart, type MonthlyRevenue } from '@/components/dashboard/revenue-chart';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard Admin | Kpsull',
  description: 'Tableau de bord administrateur - KPIs plateforme',
};

interface AdminDashboardPageProps {
  searchParams: Promise<{
    period?: TimePeriodType;
  }>;
}

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
export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  // Auth is handled by middleware (src/middleware.ts)
  const params = await searchParams;
  const period: TimePeriodType = params.period ?? 'LAST_30_DAYS';

  const currentYear = new Date().getFullYear();

  // Initialize use cases with Prisma repository + Stripe for subscription revenue
  const adminRepository = new PrismaAdminAnalyticsRepository(prisma, stripe);
  const getAdminStatsUseCase = new GetAdminStatsUseCase(adminRepository);
  const getMonthlyRevenueUseCase = new GetAdminMonthlyRevenueUseCase(adminRepository);

  // Run stats and revenue use cases in parallel
  const [result, revenueResult] = await Promise.all([
    getAdminStatsUseCase.execute({ period }),
    getMonthlyRevenueUseCase.execute({ year: currentYear }),
  ]);

  const revenueData = revenueResult.isSuccess
    ? toMonthlyRevenue(revenueResult.value.revenueByMonth)
    : MONTH_LABELS.map((month) => ({ month, revenue: 0, commissions: 0, subscriptions: 0 }));

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

  const stats: GetAdminStatsOutput = result.value;

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
            subscriptionRevenue: stats.subscriptionRevenue,
            subscriptionMRR: stats.subscriptionMRR,
            commissionRevenue: stats.commissionRevenue,
            totalOrders: stats.totalOrders,
            ordersChange: stats.ordersChange,
            newCreators: stats.newCreators,
            newCreatorsChange: stats.newCreatorsChange,
          }}
          currency="EUR"
        />

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
