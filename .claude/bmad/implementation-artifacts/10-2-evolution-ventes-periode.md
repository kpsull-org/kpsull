# Story 10.2: Evolution des Ventes par Periode

Status: ready-for-dev

## Story

As a Createur,
I want voir l'evolution de mes ventes sur une periode donnee,
so that je puisse identifier les tendances et optimiser ma strategie.

## Acceptance Criteria

1. **AC1 - Graphique CA par jour/semaine/mois**
   - **Given** un Createur sur son dashboard
   - **When** il consulte la section evolution des ventes
   - **Then** un graphique linéaire affiche le CA sur la periode
   - **And** les points sont cliquables pour voir le detail

2. **AC2 - Selecteur de periode**
   - **Given** un Createur visualisant le graphique
   - **When** il utilise le selecteur de periode
   - **Then** il peut choisir: 7 jours, 30 jours, 90 jours, 12 mois
   - **And** le graphique se met a jour immediatement
   - **And** la granularite s'adapte (jour/semaine/mois)

3. **AC3 - Granularite adaptative**
   - **Given** une periode selectionnee
   - **When** le graphique est affiche
   - **Then** 7-30 jours = points quotidiens
   - **And** 90 jours = points hebdomadaires
   - **And** 12 mois = points mensuels

4. **AC4 - Donnees complementaires**
   - **Given** un graphique affiche
   - **When** l'utilisateur survole un point
   - **Then** un tooltip affiche: date, CA, nombre de ventes
   - **And** la comparaison avec la meme periode precedente

## Tasks / Subtasks

- [ ] **Task 1: Creer le composant SalesChart** (AC: #1, #4)
  - [ ] 1.1 Creer `src/components/dashboard/sales-chart.tsx`
  - [ ] 1.2 Integrer Recharts (LineChart, XAxis, YAxis, Tooltip)
  - [ ] 1.3 Implementer le tooltip personnalise
  - [ ] 1.4 Gerer les etats loading/empty/error

- [ ] **Task 2: Creer le composant PeriodSelector** (AC: #2)
  - [ ] 2.1 Creer `src/components/dashboard/period-selector.tsx`
  - [ ] 2.2 Tabs ou dropdown avec les options de periode
  - [ ] 2.3 Gerer l'etat selectionne avec URL params

- [ ] **Task 3: Creer le service SalesChartService** (AC: #1, #3)
  - [ ] 3.1 Creer `src/modules/analytics/application/services/sales-chart.service.ts`
  - [ ] 3.2 Implementer `getSalesData(creatorId, period, granularity)`
  - [ ] 3.3 Grouper les donnees par jour/semaine/mois
  - [ ] 3.4 Calculer la comparaison periode precedente

- [ ] **Task 4: Creer les requetes agregees** (AC: #1, #3)
  - [ ] 4.1 Requete GROUP BY date/semaine/mois
  - [ ] 4.2 Optimiser avec index composite (creatorId, createdAt)

- [ ] **Task 5: Creer le Server Component wrapper** (AC: #1-4)
  - [ ] 5.1 Creer `src/components/dashboard/sales-chart-container.tsx`
  - [ ] 5.2 Fetcher les donnees cote serveur
  - [ ] 5.3 Passer les donnees au client component

- [ ] **Task 6: Ecrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests unitaires pour SalesChartService
  - [ ] 6.2 Tests composant SalesChart (mock data)
  - [ ] 6.3 Tests integration avec periode

## Dev Notes

### Composant SalesChart (Client)

```typescript
// src/components/dashboard/sales-chart.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SalesDataPoint {
  date: string;
  revenue: number;
  sales: number;
  previousRevenue?: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  showComparison?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as SalesDataPoint;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      <p className="font-medium">{label}</p>
      <p className="text-sm">
        CA: <span className="font-semibold">{formatCurrency(data.revenue)}</span>
      </p>
      <p className="text-sm">
        Ventes: <span className="font-semibold">{data.sales}</span>
      </p>
      {data.previousRevenue !== undefined && (
        <p className="text-sm text-muted-foreground">
          Periode precedente: {formatCurrency(data.previousRevenue)}
        </p>
      )}
    </div>
  );
};

export function SalesChart({ data, showComparison = false }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        Aucune donnee pour cette periode
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value, { compact: true })}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Chiffre d'affaires"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        {showComparison && (
          <Line
            type="monotone"
            dataKey="previousRevenue"
            name="Periode precedente"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Composant PeriodSelector

```typescript
// src/components/dashboard/period-selector.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '12m', label: '12 mois' },
] as const;

export type Period = typeof PERIODS[number]['value'];

interface PeriodSelectorProps {
  defaultPeriod?: Period;
}

export function PeriodSelector({ defaultPeriod = '30d' }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get('period') as Period) || defaultPeriod;

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('period', period);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={currentPeriod} onValueChange={handlePeriodChange}>
      <TabsList>
        {PERIODS.map((period) => (
          <TabsTrigger key={period.value} value={period.value}>
            {period.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
```

### Service SalesChart

```typescript
// src/modules/analytics/application/services/sales-chart.service.ts
import { prisma } from '@/lib/prisma';
import {
  subDays,
  subMonths,
  format,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export type Granularity = 'day' | 'week' | 'month';

export interface SalesDataPoint {
  date: string;
  revenue: number;
  sales: number;
  previousRevenue?: number;
}

export class SalesChartService {
  async getSalesData(
    creatorId: string,
    period: '7d' | '30d' | '90d' | '12m'
  ): Promise<SalesDataPoint[]> {
    const { start, end, granularity } = this.getPeriodBounds(period);

    // Requete agregee
    const orders = await prisma.order.findMany({
      where: {
        creatorId,
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Grouper par granularite
    const grouped = this.groupByGranularity(orders, granularity);

    // Generer tous les points (meme vides)
    const allDates = this.generateDateRange(start, end, granularity);

    return allDates.map((date) => ({
      date: this.formatDate(date, granularity),
      revenue: grouped[this.getDateKey(date, granularity)]?.revenue ?? 0,
      sales: grouped[this.getDateKey(date, granularity)]?.sales ?? 0,
    }));
  }

  private getPeriodBounds(period: string) {
    const now = new Date();

    switch (period) {
      case '7d':
        return { start: subDays(now, 7), end: now, granularity: 'day' as Granularity };
      case '30d':
        return { start: subDays(now, 30), end: now, granularity: 'day' as Granularity };
      case '90d':
        return { start: subDays(now, 90), end: now, granularity: 'week' as Granularity };
      case '12m':
        return { start: subMonths(now, 12), end: now, granularity: 'month' as Granularity };
      default:
        return { start: subDays(now, 30), end: now, granularity: 'day' as Granularity };
    }
  }

  private groupByGranularity(
    orders: Array<{ createdAt: Date; totalAmount: any }>,
    granularity: Granularity
  ): Record<string, { revenue: number; sales: number }> {
    const grouped: Record<string, { revenue: number; sales: number }> = {};

    for (const order of orders) {
      const key = this.getDateKey(order.createdAt, granularity);

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, sales: 0 };
      }

      grouped[key].revenue += order.totalAmount?.toNumber() ?? 0;
      grouped[key].sales += 1;
    }

    return grouped;
  }

  private getDateKey(date: Date, granularity: Granularity): string {
    switch (granularity) {
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return format(startOfWeek(date, { locale: fr }), 'yyyy-MM-dd');
      case 'month':
        return format(startOfMonth(date), 'yyyy-MM');
    }
  }

  private formatDate(date: Date, granularity: Granularity): string {
    switch (granularity) {
      case 'day':
        return format(date, 'd MMM', { locale: fr });
      case 'week':
        return format(date, "'S'w", { locale: fr });
      case 'month':
        return format(date, 'MMM yyyy', { locale: fr });
    }
  }

  private generateDateRange(start: Date, end: Date, granularity: Granularity): Date[] {
    switch (granularity) {
      case 'day':
        return eachDayOfInterval({ start, end });
      case 'week':
        return eachWeekOfInterval({ start, end }, { locale: fr });
      case 'month':
        return eachMonthOfInterval({ start, end });
    }
  }
}
```

### Server Component Container

```typescript
// src/components/dashboard/sales-chart-container.tsx
import { SalesChart } from './sales-chart';
import { PeriodSelector, Period } from './period-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { container } from '@/lib/container';
import { SalesChartService } from '@/modules/analytics/application/services/sales-chart.service';

interface SalesChartContainerProps {
  creatorId: string;
  period?: Period;
}

export async function SalesChartContainer({
  creatorId,
  period = '30d'
}: SalesChartContainerProps) {
  const service = container.resolve(SalesChartService);
  const data = await service.getSalesData(creatorId, period);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evolution des ventes</CardTitle>
        <PeriodSelector defaultPeriod={period} />
      </CardHeader>
      <CardContent>
        <SalesChart data={data} />
      </CardContent>
    </Card>
  );
}
```

### Integration Page Dashboard

```typescript
// Dans src/app/(dashboard)/dashboard/page.tsx
import { SalesChartContainer } from '@/components/dashboard/sales-chart-container';

// Dans le JSX, apres StatsGrid:
<Suspense fallback={<SalesChartSkeleton />}>
  <SalesChartContainer
    creatorId={session.user.creatorId}
    period={searchParams.period as Period}
  />
</Suspense>
```

### Dependencies

```bash
bun add recharts date-fns
```

### References

- [Source: architecture.md#Analytics Module]
- [Source: prd.md#FR15]
- [Source: epics.md#Story 10.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
