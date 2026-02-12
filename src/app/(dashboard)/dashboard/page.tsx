import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import {
  Package,
  Users,
  ArrowRight,
  CreditCard,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart, type MonthlyRevenue } from '@/components/dashboard/revenue-chart';
import { DashboardCoachMarks } from './dashboard-coach-marks';

export const metadata: Metadata = {
  title: 'Tableau de bord | Kpsull',
  description: 'Gerez votre activite de createur sur Kpsull',
};

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
}

/** French short month labels indexed 0..11 */
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Fetch dashboard statistics for a creator from the database.
 *
 * Returns order count, revenue sum (cents), distinct customer count,
 * active product count, pending orders, and monthly revenue breakdown.
 */
async function getDashboardStats(creatorId: string) {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear + 1, 0, 1);

  // Run independent queries in parallel for performance
  const [
    orderAgg,
    distinctCustomers,
    activeProductCount,
    pendingOrderCount,
    ordersForRevenue,
  ] = await Promise.all([
    // Total orders + total revenue for this creator
    prisma.order.aggregate({
      where: { creatorId },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),

    // Distinct customers (unique customerId values)
    prisma.order.findMany({
      where: { creatorId },
      select: { customerId: true },
      distinct: ['customerId'],
    }),

    // Active (published) products
    prisma.product.count({
      where: { creatorId, status: 'PUBLISHED' },
    }),

    // Pending orders (not yet shipped/delivered/completed)
    prisma.order.count({
      where: { creatorId, status: 'PENDING' },
    }),

    // Orders in current year for monthly revenue chart
    prisma.order.findMany({
      where: {
        creatorId,
        createdAt: { gte: yearStart, lt: yearEnd },
      },
      select: { totalAmount: true, createdAt: true },
    }),
  ]);

  // Build monthly revenue from current-year orders
  const monthlyRevenueCents: Record<number, number> = {};
  for (let m = 0; m < 12; m++) {
    monthlyRevenueCents[m] = 0;
  }
  for (const order of ordersForRevenue) {
    const monthIndex = order.createdAt.getMonth();
    monthlyRevenueCents[monthIndex] = (monthlyRevenueCents[monthIndex] ?? 0) + order.totalAmount;
  }

  const revenueData: MonthlyRevenue[] = MONTH_LABELS.map((month, i) => ({
    month,
    revenue: (monthlyRevenueCents[i] ?? 0) / 100, // convert cents to euros
  }));

  return {
    totalOrders: orderAgg._count.id,
    totalRevenueCents: orderAgg._sum.totalAmount ?? 0,
    totalCustomers: distinctCustomers.length,
    activeProducts: activeProductCount,
    pendingOrders: pendingOrderCount,
    revenueData,
  };
}

/**
 * Format an integer amount in cents as a French-locale EUR string.
 * Example: 123456 -> "1 234,56 EUR"
 */
function formatCentsAsEur(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros) + ' EUR';
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    // JWT might be stale after role change — verify against DB
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role !== 'CREATOR' && dbUser?.role !== 'ADMIN') {
      redirect('/mon-compte');
    }
  }

  // Check if dashboard tour needs to be shown
  const onboarding = await prisma.creatorOnboarding.findUnique({
    where: { userId: session.user.id },
    select: { dashboardTourCompleted: true },
  });
  const isNewCreator = params.welcome === 'true';
  const showWelcomeTour = !onboarding?.dashboardTourCompleted || isNewCreator;

  const firstName = session.user.name?.split(' ')[0] ?? 'Createur';
  const currentYear = new Date().getFullYear();

  // Fetch real stats from the database
  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="max-w-6xl space-y-8">
      <DashboardCoachMarks showTour={showWelcomeTour} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bonjour {firstName}, voici un apercu de votre activite.
        </p>
      </div>

      {/* Stats Cards */}
      <section aria-label="Statistiques" data-coach-mark="stats">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Commandes"
            value={String(stats.totalOrders)}
            icon={Package}
            badge={stats.pendingOrders}
          />
          <StatCard
            title="Chiffre d'affaires"
            value={formatCentsAsEur(stats.totalRevenueCents)}
            icon={DollarSign}
          />
          <StatCard
            title="Clients"
            value={String(stats.totalCustomers)}
            icon={Users}
          />
          <StatCard
            title="Produits actifs"
            value={String(stats.activeProducts)}
            icon={ShoppingBag}
          />
        </div>
      </section>

      {/* Revenue Chart */}
      <section aria-label="Chiffre d'affaires" data-coach-mark="revenue">
        <RevenueChart data={stats.revenueData} year={currentYear} />
      </section>

      {/* Quick Actions */}
      <section aria-label="Acces rapide" data-coach-mark="quick-actions">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          Acces rapide
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Commandes"
            description="Suivez et gerez vos commandes en cours"
            href="/dashboard/orders"
            icon={Package}
            badge={stats.pendingOrders}
          />
          <QuickActionCard
            title="Produits"
            description="Gerez votre catalogue de produits"
            href="/dashboard/products"
            icon={ShoppingBag}
          />
          <QuickActionCard
            title="Clients"
            description="Consultez l'historique de vos clients"
            href="/dashboard/customers"
            icon={Users}
          />
          <QuickActionCard
            title="Mon abonnement"
            description="Gerez votre plan et votre facturation"
            href="/subscription"
            icon={CreditCard}
          />
        </div>
      </section>

      {/* Subscription Status */}
      <section aria-label="Abonnement" data-coach-mark="subscription">
        <Card className="border-2 border-dashed border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Votre abonnement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Consultez votre plan actuel, suivez votre utilisation et decouvrez
              les fonctionnalites disponibles.
            </p>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/subscription">
                Voir mon abonnement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function QuickActionCard({ title, description, href, icon: Icon, badge }: QuickActionCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <div className="relative rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
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
