# Story 11.1: Dashboard Admin avec KPIs

Status: ready-for-dev

## Story

As a Admin,
I want voir les KPIs de la plateforme en temps réel,
so that je puisse monitorer la santé de la plateforme et prendre des décisions stratégiques.

## Acceptance Criteria

1. **AC1 - Affichage des KPIs principaux**
   - **Given** un Admin connecté sur le dashboard
   - **When** il accède à `/admin/dashboard`
   - **Then** il voit les KPIs : MRR total, nombre de créateurs actifs, GMV (Gross Merchandise Value), commissions perçues

2. **AC2 - Graphiques d'évolution**
   - **Given** un Admin sur le dashboard
   - **When** il consulte les graphiques
   - **Then** il voit l'évolution sur 30 jours du MRR, des nouvelles inscriptions, et du volume de ventes
   - **And** il peut changer la période (7j, 30j, 90j, 12 mois)

3. **AC3 - KPIs en temps réel**
   - **Given** un Admin sur le dashboard
   - **When** de nouvelles données arrivent
   - **Then** les KPIs se mettent à jour automatiquement toutes les 5 minutes

4. **AC4 - Accès sécurisé**
   - **Given** un utilisateur non-admin
   - **When** il tente d'accéder au dashboard admin
   - **Then** il est redirigé vers la page d'accueil

## Tasks / Subtasks

- [ ] **Task 1: Créer la page dashboard admin** (AC: #1, #4)
  - [ ] 1.1 Créer `src/app/(admin)/admin/dashboard/page.tsx`
  - [ ] 1.2 Implémenter le layout admin avec sidebar
  - [ ] 1.3 Ajouter la vérification du rôle ADMIN
  - [ ] 1.4 Créer les composants KPICard réutilisables

- [ ] **Task 2: Implémenter AdminStatsService** (AC: #1, #3)
  - [ ] 2.1 Créer `src/modules/admin/application/services/admin-stats.service.ts`
  - [ ] 2.2 Implémenter `getMRR()` - calcul du Monthly Recurring Revenue
  - [ ] 2.3 Implémenter `getActiveCreatorsCount()` - créateurs avec statut ACTIVE
  - [ ] 2.4 Implémenter `getGMV()` - volume total des ventes
  - [ ] 2.5 Implémenter `getTotalCommissions()` - commissions plateforme

- [ ] **Task 3: Créer les composants de visualisation** (AC: #2)
  - [ ] 3.1 Créer `KPICard` avec icône, valeur, variation
  - [ ] 3.2 Créer `StatsChart` pour les graphiques d'évolution
  - [ ] 3.3 Créer `PeriodSelector` pour changer la période
  - [ ] 3.4 Intégrer une librairie de graphiques (recharts ou chart.js)

- [ ] **Task 4: Implémenter les routes API** (AC: #1, #2, #3)
  - [ ] 4.1 Créer `GET /api/admin/stats/overview`
  - [ ] 4.2 Créer `GET /api/admin/stats/chart?period=30d`
  - [ ] 4.3 Ajouter le middleware de vérification admin

- [ ] **Task 5: Écrire les tests** (AC: #1-4)
  - [ ] 5.1 Tests unitaires pour AdminStatsService
  - [ ] 5.2 Tests d'intégration pour les API routes
  - [ ] 5.3 Tests de permissions admin

## Dev Notes

### Structure Page Dashboard

```typescript
// src/app/(admin)/admin/dashboard/page.tsx
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { KPICard } from "@/components/admin/KPICard";
import { StatsChart } from "@/components/admin/StatsChart";
import { getAdminStats } from "@/modules/admin/application/services/admin-stats.service";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getAdminStats();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="MRR"
          value={stats.mrr}
          format="currency"
          variation={stats.mrrVariation}
          icon="TrendingUp"
        />
        <KPICard
          title="Créateurs actifs"
          value={stats.activeCreators}
          variation={stats.creatorsVariation}
          icon="Users"
        />
        <KPICard
          title="GMV"
          value={stats.gmv}
          format="currency"
          variation={stats.gmvVariation}
          icon="ShoppingBag"
        />
        <KPICard
          title="Commissions"
          value={stats.commissions}
          format="currency"
          variation={stats.commissionsVariation}
          icon="Wallet"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsChart
          title="Évolution MRR"
          data={stats.mrrHistory}
          type="area"
        />
        <StatsChart
          title="Volume de ventes"
          data={stats.salesHistory}
          type="bar"
        />
      </div>
    </div>
  );
}
```

### AdminStatsService

```typescript
// src/modules/admin/application/services/admin-stats.service.ts
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

export interface AdminStats {
  mrr: number;
  mrrVariation: number;
  activeCreators: number;
  creatorsVariation: number;
  gmv: number;
  gmvVariation: number;
  commissions: number;
  commissionsVariation: number;
  mrrHistory: ChartDataPoint[];
  salesHistory: ChartDataPoint[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

  // MRR - Monthly Recurring Revenue (abonnements PRO)
  const [currentMrr, previousMrr] = await Promise.all([
    calculateMRR(thirtyDaysAgo, now),
    calculateMRR(sixtyDaysAgo, thirtyDaysAgo),
  ]);

  // Créateurs actifs
  const [currentCreators, previousCreators] = await Promise.all([
    prisma.creator.count({
      where: { status: "ACTIVE" },
    }),
    prisma.creator.count({
      where: {
        status: "ACTIVE",
        createdAt: { lt: thirtyDaysAgo },
      },
    }),
  ]);

  // GMV - Gross Merchandise Value
  const [currentGmv, previousGmv] = await Promise.all([
    calculateGMV(thirtyDaysAgo, now),
    calculateGMV(sixtyDaysAgo, thirtyDaysAgo),
  ]);

  // Commissions
  const [currentCommissions, previousCommissions] = await Promise.all([
    calculateCommissions(thirtyDaysAgo, now),
    calculateCommissions(sixtyDaysAgo, thirtyDaysAgo),
  ]);

  return {
    mrr: currentMrr,
    mrrVariation: calculateVariation(currentMrr, previousMrr),
    activeCreators: currentCreators,
    creatorsVariation: calculateVariation(currentCreators, previousCreators),
    gmv: currentGmv,
    gmvVariation: calculateVariation(currentGmv, previousGmv),
    commissions: currentCommissions,
    commissionsVariation: calculateVariation(currentCommissions, previousCommissions),
    mrrHistory: await getMRRHistory(30),
    salesHistory: await getSalesHistory(30),
  };
}

async function calculateMRR(from: Date, to: Date): Promise<number> {
  const result = await prisma.subscription.aggregate({
    where: {
      plan: "PRO",
      status: "ACTIVE",
      createdAt: { gte: from, lt: to },
    },
    _sum: { price: true },
  });
  return result._sum.price || 0;
}

async function calculateGMV(from: Date, to: Date): Promise<number> {
  const result = await prisma.order.aggregate({
    where: {
      status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: from, lt: to },
    },
    _sum: { totalAmount: true },
  });
  return result._sum.totalAmount || 0;
}

async function calculateCommissions(from: Date, to: Date): Promise<number> {
  const result = await prisma.order.aggregate({
    where: {
      status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: from, lt: to },
    },
    _sum: { platformFee: true },
  });
  return result._sum.platformFee || 0;
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
```

### Composant KPICard

```typescript
// src/components/admin/KPICard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, ShoppingBag, Wallet } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

interface KPICardProps {
  title: string;
  value: number;
  format?: "currency" | "number";
  variation: number;
  icon: "TrendingUp" | "Users" | "ShoppingBag" | "Wallet";
}

const icons = {
  TrendingUp,
  Users,
  ShoppingBag,
  Wallet,
};

export function KPICard({ title, value, format = "number", variation, icon }: KPICardProps) {
  const Icon = icons[icon];
  const isPositive = variation >= 0;
  const formattedValue = format === "currency" ? formatCurrency(value) : formatNumber(value);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <div className={`flex items-center text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          <span>{Math.abs(variation)}% vs mois précédent</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR13, FR14]
- [Source: epics.md#Epic 11 - Administration]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
