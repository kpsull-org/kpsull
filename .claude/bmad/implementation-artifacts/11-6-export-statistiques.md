# Story 11.6: Export Statistiques Plateforme

Status: ready-for-dev

## Story

As a Admin,
I want exporter les statistiques de la plateforme,
so that je puisse analyser les données hors-ligne et produire des rapports.

## Acceptance Criteria

1. **AC1 - Export CSV créateurs**
   - **Given** un Admin sur la page créateurs
   - **When** il clique sur "Exporter CSV"
   - **Then** un fichier CSV est téléchargé avec : nom, email, statut, CA, date inscription, plan

2. **AC2 - Export CSV commandes**
   - **Given** un Admin sur la page rapports
   - **When** il exporte les commandes
   - **Then** un fichier CSV est généré avec : référence, date, créateur, client, montant, statut, commission

3. **AC3 - Export CSV revenus**
   - **Given** un Admin sur la page rapports
   - **When** il exporte les revenus
   - **Then** un fichier CSV est généré avec : période, GMV, commissions, abonnements, total revenus

4. **AC4 - Rapport PDF mensuel**
   - **Given** un Admin sur la page rapports
   - **When** il génère le rapport mensuel
   - **Then** un PDF est créé avec : résumé KPIs, graphiques, top créateurs, tendances

5. **AC5 - Filtres d'export**
   - **Given** un Admin qui exporte des données
   - **When** il configure l'export
   - **Then** il peut filtrer par période (dates), statut, créateur

## Tasks / Subtasks

- [ ] **Task 1: Créer la page rapports admin** (AC: #1-5)
  - [ ] 1.1 Créer `src/app/(admin)/admin/reports/page.tsx`
  - [ ] 1.2 Ajouter les sections d'export (créateurs, commandes, revenus)
  - [ ] 1.3 Implémenter les filtres de période et statut
  - [ ] 1.4 Ajouter la section génération PDF

- [ ] **Task 2: Implémenter les exports CSV** (AC: #1, #2, #3)
  - [ ] 2.1 Créer `ExportCreatorsCSVUseCase`
  - [ ] 2.2 Créer `ExportOrdersCSVUseCase`
  - [ ] 2.3 Créer `ExportRevenueCSVUseCase`
  - [ ] 2.4 Créer les routes API d'export

- [ ] **Task 3: Implémenter la génération PDF** (AC: #4)
  - [ ] 3.1 Intégrer une librairie PDF (react-pdf ou pdfmake)
  - [ ] 3.2 Créer le template de rapport mensuel
  - [ ] 3.3 Générer les graphiques pour le PDF
  - [ ] 3.4 Créer `GenerateMonthlyReportUseCase`

- [ ] **Task 4: Implémenter le service d'export** (AC: #5)
  - [ ] 4.1 Créer `ExportService` centralisé
  - [ ] 4.2 Gérer les gros volumes (streaming)
  - [ ] 4.3 Ajouter la progression pour les exports longs

- [ ] **Task 5: Écrire les tests** (AC: #1-5)
  - [ ] 5.1 Tests unitaires pour les use cases
  - [ ] 5.2 Tests de génération CSV
  - [ ] 5.3 Tests de génération PDF

## Dev Notes

### Page Rapports Admin

```typescript
// src/app/(admin)/admin/reports/page.tsx
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportCreatorsCard } from "./components/ExportCreatorsCard";
import { ExportOrdersCard } from "./components/ExportOrdersCard";
import { ExportRevenueCard } from "./components/ExportRevenueCard";
import { MonthlyReportCard } from "./components/MonthlyReportCard";

export default async function ReportsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Rapports et exports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExportCreatorsCard />
        <ExportOrdersCard />
        <ExportRevenueCard />
        <MonthlyReportCard />
      </div>
    </div>
  );
}
```

### Composant Export Créateurs

```typescript
// src/app/(admin)/admin/reports/components/ExportCreatorsCard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusOptions = [
  { value: "PENDING_VERIFICATION", label: "En attente" },
  { value: "ACTIVE", label: "Actif" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "REJECTED", label: "Refusé" },
];

const planOptions = [
  { value: "FREE", label: "Free" },
  { value: "PRO", label: "Pro" },
];

export function ExportCreatorsCard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.set("from", format(dateRange.from, "yyyy-MM-dd"));
        params.set("to", format(dateRange.to, "yyyy-MM-dd"));
      }
      if (statuses.length > 0) {
        params.set("statuses", statuses.join(","));
      }
      if (plans.length > 0) {
        params.set("plans", plans.join(","));
      }

      const response = await fetch(`/api/admin/exports/creators?${params.toString()}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `creators-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Créateurs</CardTitle>
        <CardDescription>
          Exportez la liste des créateurs au format CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Période d'inscription</Label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Toutes les dates"
          />
        </div>

        <div className="space-y-2">
          <Label>Statuts</Label>
          <MultiSelect
            options={statusOptions}
            selected={statuses}
            onChange={setStatuses}
            placeholder="Tous les statuts"
          />
        </div>

        <div className="space-y-2">
          <Label>Plans</Label>
          <MultiSelect
            options={planOptions}
            selected={plans}
            onChange={setPlans}
            placeholder="Tous les plans"
          />
        </div>

        <Button onClick={handleExport} disabled={isExporting} className="w-full">
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Télécharger CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### API Route Export Créateurs CSV

```typescript
// src/app/api/admin/exports/creators/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { stringify } from "csv-stringify/sync";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const statuses = searchParams.get("statuses")?.split(",") || [];
  const plans = searchParams.get("plans")?.split(",") || [];

  const where: Prisma.CreatorWhereInput = {
    ...(from && to && {
      createdAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    }),
    ...(statuses.length > 0 && {
      status: { in: statuses as any[] },
    }),
    ...(plans.length > 0 && {
      subscription: { plan: { in: plans as any[] } },
    }),
  };

  const creators = await prisma.creator.findMany({
    where,
    include: {
      user: { select: { email: true, name: true } },
      subscription: { select: { plan: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculer le CA pour chaque créateur
  const creatorsWithRevenue = await Promise.all(
    creators.map(async (creator) => {
      const revenue = await prisma.order.aggregate({
        where: {
          creatorId: creator.id,
          status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        },
        _sum: { totalAmount: true },
      });

      return {
        "Nom de marque": creator.brandName,
        "Nom": creator.user.name,
        "Email": creator.user.email,
        "SIRET": creator.siret,
        "Statut": creator.status,
        "Plan": creator.subscription?.plan || "FREE",
        "CA Total (EUR)": (revenue._sum.totalAmount || 0) / 100,
        "Date inscription": creator.createdAt.toISOString().split("T")[0],
      };
    })
  );

  const csv = stringify(creatorsWithRevenue, {
    header: true,
    delimiter: ";",
    bom: true, // UTF-8 BOM pour Excel
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="creators-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
```

### API Route Export Commandes CSV

```typescript
// src/app/api/admin/exports/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { stringify } from "csv-stringify/sync";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const creatorId = searchParams.get("creatorId");
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      ...(from && to && {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      }),
      ...(creatorId && { creatorId }),
      ...(status && { status: status as any }),
    },
    include: {
      creator: { select: { brandName: true } },
      customer: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csvData = orders.map((order) => ({
    "Référence": order.orderNumber,
    "Date": order.createdAt.toISOString(),
    "Créateur": order.creator.brandName,
    "Client": order.customer.name,
    "Email client": order.customer.email,
    "Montant (EUR)": order.totalAmount / 100,
    "Commission (EUR)": order.platformFee / 100,
    "Statut": order.status,
    "Livraison": order.shippingStatus || "N/A",
  }));

  const csv = stringify(csvData, {
    header: true,
    delimiter: ";",
    bom: true,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
```

### Génération Rapport PDF Mensuel

```typescript
// src/modules/admin/application/use-cases/generate-monthly-report.use-case.ts
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface MonthlyReportData {
  period: string;
  summary: {
    totalRevenue: number;
    gmv: number;
    commissions: number;
    subscriptions: number;
    newCreators: number;
    newCustomers: number;
    totalOrders: number;
  };
  trends: {
    revenueGrowth: number;
    gmvGrowth: number;
    creatorsGrowth: number;
  };
  topCreators: Array<{
    brandName: string;
    revenue: number;
    orders: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
}

export async function generateMonthlyReportData(
  month: Date
): Promise<MonthlyReportData> {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  const prevStartDate = startOfMonth(subMonths(month, 1));
  const prevEndDate = endOfMonth(subMonths(month, 1));

  // Métriques du mois courant
  const [currentGmv, currentCommissions, currentSubscriptions] =
    await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
        },
        _sum: { platformFee: true },
      }),
      prisma.subscription.aggregate({
        where: {
          plan: "PRO",
          status: "ACTIVE",
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { price: true },
      }),
    ]);

  // Métriques du mois précédent
  const [prevGmv, prevCommissions] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
      },
      _sum: { platformFee: true },
    }),
  ]);

  // Nouveaux créateurs et clients
  const [newCreators, newCustomers, totalOrders] = await Promise.all([
    prisma.creator.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        role: "CUSTOMER",
      },
    }),
    prisma.order.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
  ]);

  // Top 10 créateurs
  const topCreators = await prisma.order.groupBy({
    by: ["creatorId"],
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "SHIPPED", "DELIVERED"] },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });

  const creatorsData = await Promise.all(
    topCreators.map(async (tc) => {
      const creator = await prisma.creator.findUnique({
        where: { id: tc.creatorId },
        select: { brandName: true },
      });
      return {
        brandName: creator?.brandName || "Inconnu",
        revenue: tc._sum.totalAmount || 0,
        orders: tc._count.id,
      };
    })
  );

  const gmv = currentGmv._sum.totalAmount || 0;
  const commissions = currentCommissions._sum.platformFee || 0;
  const subscriptions = currentSubscriptions._sum.price || 0;
  const totalRevenue = commissions + subscriptions;

  const prevGmvValue = prevGmv._sum.totalAmount || 1;
  const prevCommValue = prevCommissions._sum.platformFee || 1;

  return {
    period: format(month, "MMMM yyyy", { locale: fr }),
    summary: {
      totalRevenue,
      gmv,
      commissions,
      subscriptions,
      newCreators,
      newCustomers,
      totalOrders,
    },
    trends: {
      revenueGrowth: Math.round(
        ((totalRevenue - prevCommValue) / prevCommValue) * 100
      ),
      gmvGrowth: Math.round(((gmv - prevGmvValue) / prevGmvValue) * 100),
      creatorsGrowth: 0, // À calculer
    },
    topCreators: creatorsData,
    categoryBreakdown: [], // À implémenter selon les catégories
  };
}
```

### API Route Génération PDF

```typescript
// src/app/api/admin/exports/monthly-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { generateMonthlyReportData } from "@/modules/admin/application/use-cases/generate-monthly-report.use-case";
import { generatePDF } from "@/lib/pdf/generate-report";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const monthParam = searchParams.get("month");
  const month = monthParam ? new Date(monthParam) : new Date();

  const reportData = await generateMonthlyReportData(month);
  const pdfBuffer = await generatePDF(reportData);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-${reportData.period.replace(" ", "-")}.pdf"`,
    },
  });
}
```

### Composant Rapport Mensuel

```typescript
// src/app/(admin)/admin/reports/components/MonthlyReportCard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export function MonthlyReportCard() {
  const [selectedMonth, setSelectedMonth] = useState(
    format(subMonths(new Date(), 1), "yyyy-MM")
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Générer les 12 derniers mois
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i + 1);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: fr }),
    };
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/admin/exports/monthly-report?month=${selectedMonth}-01`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-${selectedMonth}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rapport mensuel PDF</CardTitle>
        <CardDescription>
          Générez un rapport complet avec KPIs, graphiques et tendances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mois du rapport</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">Le rapport inclut :</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>- Résumé des KPIs (MRR, GMV, commissions)</li>
            <li>- Graphiques d'évolution</li>
            <li>- Top 10 créateurs du mois</li>
            <li>- Analyse des tendances</li>
            <li>- Répartition par catégorie</li>
          </ul>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Générer le rapport PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR14]
- [Source: epics.md#Epic 11 - Administration]
- [Story: 11.1 - Dashboard KPIs]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
