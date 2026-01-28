# Story 10.1: Dashboard avec Statistiques Cles

Status: ready-for-dev

## Story

As a Createur,
I want voir mes statistiques cles en un coup d'oeil,
so that je puisse suivre la performance de ma boutique rapidement.

## Acceptance Criteria

1. **AC1 - Affichage des metriques principales**
   - **Given** un Createur connecte sur son dashboard
   - **When** il accede a la page dashboard
   - **Then** il voit le CA total, le nombre de ventes, et le panier moyen
   - **And** les donnees correspondent a la periode selectionnee (defaut: 30 derniers jours)

2. **AC2 - Affichage des tendances**
   - **Given** un Createur sur son dashboard
   - **When** les statistiques sont affichees
   - **Then** chaque metrique affiche la variation par rapport a la periode precedente
   - **And** la variation est coloree en vert (positif) ou rouge (negatif)
   - **And** le pourcentage de variation est affiche

3. **AC3 - Chargement et etats**
   - **Given** un Createur accedant au dashboard
   - **When** les donnees sont en cours de chargement
   - **Then** des skeletons sont affiches pour chaque carte
   - **And** en cas d'erreur, un message explicatif apparait

4. **AC4 - Donnees temps reel**
   - **Given** un Createur sur son dashboard
   - **When** une nouvelle vente est enregistree
   - **Then** les statistiques sont mises a jour (refresh manuel ou auto)

## Tasks / Subtasks

- [ ] **Task 1: Creer la page dashboard** (AC: #1, #3)
  - [ ] 1.1 Creer `src/app/(dashboard)/dashboard/page.tsx`
  - [ ] 1.2 Implementer le layout avec grille de cartes
  - [ ] 1.3 Gerer les etats loading/error avec Suspense

- [ ] **Task 2: Creer le composant StatsCard** (AC: #1, #2)
  - [ ] 2.1 Creer `src/components/dashboard/stats-card.tsx`
  - [ ] 2.2 Props: title, value, trend, trendLabel, icon
  - [ ] 2.3 Afficher la variation avec couleur conditionnelle
  - [ ] 2.4 Creer le skeleton associe `stats-card-skeleton.tsx`

- [ ] **Task 3: Creer le service StatsService** (AC: #1, #2, #4)
  - [ ] 3.1 Creer `src/modules/analytics/application/services/stats.service.ts`
  - [ ] 3.2 Implementer `getKeyMetrics(creatorId, dateRange)`
  - [ ] 3.3 Calculer les variations vs periode precedente

- [ ] **Task 4: Creer le use case GetDashboardStats** (AC: #1, #2)
  - [ ] 4.1 Creer `src/modules/analytics/application/use-cases/get-dashboard-stats.use-case.ts`
  - [ ] 4.2 Agréger CA total, nombre de ventes, panier moyen
  - [ ] 4.3 Calculer les tendances

- [ ] **Task 5: Creer les requetes Prisma** (AC: #1, #2)
  - [ ] 5.1 Creer `src/modules/analytics/infrastructure/analytics.repository.ts`
  - [ ] 5.2 Requete agregat CA par periode
  - [ ] 5.3 Requete nombre de commandes par periode
  - [ ] 5.4 Optimiser avec index sur createdAt

- [ ] **Task 6: Ecrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour StatsService
  - [ ] 6.2 Tests unitaires pour GetDashboardStatsUseCase
  - [ ] 6.3 Tests composant StatsCard

## Dev Notes

### Structure Page Dashboard

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { StatsGridSkeleton } from '@/components/dashboard/stats-grid-skeleton';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.creatorId) {
    redirect('/become-creator');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activite
        </p>
      </div>

      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid creatorId={session.user.creatorId} />
      </Suspense>
    </div>
  );
}
```

### Composant StatsCard

```typescript
// src/components/dashboard/stats-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, trend, trendLabel, icon }: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-4 w-4" />;
    return trend > 0
      ? <TrendingUp className="h-4 w-4" />
      : <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-muted-foreground';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={cn('text-xs flex items-center gap-1', getTrendColor())}>
            {getTrendIcon()}
            <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Service Stats

```typescript
// src/modules/analytics/application/services/stats.service.ts
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface KeyMetrics {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  revenueTrend: number;
  salesTrend: number;
  aovTrend: number;
}

export class StatsService {
  async getKeyMetrics(creatorId: string, days: number = 30): Promise<KeyMetrics> {
    const now = new Date();
    const periodStart = startOfDay(subDays(now, days));
    const periodEnd = endOfDay(now);

    const prevPeriodStart = startOfDay(subDays(periodStart, days));
    const prevPeriodEnd = endOfDay(subDays(periodEnd, days));

    // Periode actuelle
    const currentStats = await this.getPeriodStats(creatorId, periodStart, periodEnd);

    // Periode precedente
    const prevStats = await this.getPeriodStats(creatorId, prevPeriodStart, prevPeriodEnd);

    return {
      totalRevenue: currentStats.revenue,
      totalSales: currentStats.sales,
      averageOrderValue: currentStats.sales > 0
        ? currentStats.revenue / currentStats.sales
        : 0,
      revenueTrend: this.calculateTrend(currentStats.revenue, prevStats.revenue),
      salesTrend: this.calculateTrend(currentStats.sales, prevStats.sales),
      aovTrend: this.calculateTrend(
        currentStats.sales > 0 ? currentStats.revenue / currentStats.sales : 0,
        prevStats.sales > 0 ? prevStats.revenue / prevStats.sales : 0
      ),
    };
  }

  private async getPeriodStats(creatorId: string, start: Date, end: Date) {
    const result = await prisma.order.aggregate({
      where: {
        creatorId,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      revenue: result._sum.totalAmount?.toNumber() ?? 0,
      sales: result._count.id,
    };
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
```

### Use Case GetDashboardStats

```typescript
// src/modules/analytics/application/use-cases/get-dashboard-stats.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { StatsService, KeyMetrics } from '../services/stats.service';

interface GetDashboardStatsInput {
  creatorId: string;
  days?: number;
}

export class GetDashboardStatsUseCase implements UseCase<GetDashboardStatsInput, KeyMetrics> {
  constructor(private readonly statsService: StatsService) {}

  async execute(input: GetDashboardStatsInput): Promise<Result<KeyMetrics>> {
    try {
      const metrics = await this.statsService.getKeyMetrics(
        input.creatorId,
        input.days ?? 30
      );
      return Result.ok(metrics);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return Result.fail('Impossible de charger les statistiques');
    }
  }
}
```

### StatsGrid Component

```typescript
// src/components/dashboard/stats-grid.tsx
import { StatsCard } from './stats-card';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { container } from '@/lib/container';
import { GetDashboardStatsUseCase } from '@/modules/analytics/application/use-cases/get-dashboard-stats.use-case';
import { formatCurrency } from '@/lib/utils';

interface StatsGridProps {
  creatorId: string;
}

export async function StatsGrid({ creatorId }: StatsGridProps) {
  const useCase = container.resolve(GetDashboardStatsUseCase);
  const result = await useCase.execute({ creatorId });

  if (result.isFailure) {
    return <div className="text-red-500">{result.error}</div>;
  }

  const metrics = result.getValue();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Chiffre d'affaires"
        value={formatCurrency(metrics.totalRevenue)}
        trend={metrics.revenueTrend}
        trendLabel="vs periode precedente"
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Nombre de ventes"
        value={metrics.totalSales.toString()}
        trend={metrics.salesTrend}
        trendLabel="vs periode precedente"
        icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Panier moyen"
        value={formatCurrency(metrics.averageOrderValue)}
        trend={metrics.aovTrend}
        trendLabel="vs periode precedente"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
```

### References

- [Source: architecture.md#Analytics Module]
- [Source: prd.md#FR14, FR15]
- [Source: epics.md#Story 10.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
