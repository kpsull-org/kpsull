import { Suspense } from 'react';
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
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCoachMarks } from './dashboard-coach-marks';
import { DashboardStats } from './dashboard-stats';
import { DashboardStatsSkeleton } from './dashboard-stats-skeleton';

export const metadata: Metadata = {
  title: 'Tableau de bord | Kpsull',
  description: 'Gerez votre activite de createur sur Kpsull',
};

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
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

  const isNewCreator = params.welcome === 'true';
  const firstName = session.user.name?.split(' ')[0] ?? 'Createur';

  const onboarding = await prisma.creatorOnboarding.findUnique({
    where: { userId: session.user.id },
    select: { dashboardTourCompleted: true },
  });

  const showWelcomeTour = !onboarding?.dashboardTourCompleted || isNewCreator;

  return (
    <div className="space-y-10">
      <DashboardCoachMarks showTour={showWelcomeTour} />

      {/* Header — visible immédiatement */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight kp-luxury-reveal">
          Bonjour {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Voici un apercu de votre activite.
        </p>
      </div>

      {/* Stats + Chart — streamés indépendamment */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats creatorId={session.user.id} />
      </Suspense>

      {/* Quick Actions — statique, visible immédiatement */}
      <section aria-label="Acces rapide" data-coach-mark="quick-actions">
        <h2 className="text-lg font-semibold tracking-tight mb-5">
          Acces rapide
        </h2>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Commandes"
            description="Suivez et gerez vos commandes en cours"
            href="/dashboard/orders"
            icon={Package}
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
