# Story 10.5: Export Rapports (PRO)

Status: ready-for-dev

## Story

As a Createur PRO,
I want exporter mes rapports de ventes et clients,
so that je puisse analyser mes donnees dans mes propres outils ou les archiver.

## Acceptance Criteria

1. **AC1 - Export CSV des ventes**
   - **Given** un Createur PRO sur la page exports
   - **When** il clique sur "Exporter les ventes"
   - **Then** un fichier CSV est telecharge
   - **And** il contient: date, numero commande, client, produits, montant, statut
   - **And** il peut filtrer par periode avant export

2. **AC2 - Export CSV des clients**
   - **Given** un Createur PRO sur la page exports
   - **When** il clique sur "Exporter les clients"
   - **Then** un fichier CSV est telecharge
   - **And** il contient: nom, email (complet), nombre commandes, CA total, derniere commande
   - **And** les donnees sont conformes RGPD (pas de donnees sensibles)

3. **AC3 - Export CSV des produits**
   - **Given** un Createur PRO sur la page exports
   - **When** il clique sur "Exporter les produits"
   - **Then** un fichier CSV est telecharge
   - **And** il contient: nom, SKU, prix, stock, ventes totales, CA total

4. **AC4 - Export PDF rapport mensuel**
   - **Given** un Createur PRO qui demande un rapport mensuel
   - **When** il selectionne un mois et clique sur "Generer PDF"
   - **Then** un fichier PDF est genere et telecharge
   - **And** il contient: resume CA, graphique ventes, top produits, resume clients

5. **AC5 - Blocage pour FREE**
   - **Given** un Createur FREE qui accede a /exports
   - **When** la page se charge
   - **Then** les boutons d'export sont desactives
   - **And** un message PRO-only avec CTA upgrade est affiche

## Tasks / Subtasks

- [ ] **Task 1: Creer la page exports** (AC: #1-4, #5)
  - [ ] 1.1 Creer `src/app/(dashboard)/exports/page.tsx`
  - [ ] 1.2 Layout avec sections: Ventes, Clients, Produits, Rapports PDF
  - [ ] 1.3 Verifier subscription PRO

- [ ] **Task 2: Creer les API routes d'export CSV** (AC: #1-3)
  - [ ] 2.1 Creer `src/app/api/exports/sales/route.ts`
  - [ ] 2.2 Creer `src/app/api/exports/customers/route.ts`
  - [ ] 2.3 Creer `src/app/api/exports/products/route.ts`
  - [ ] 2.4 Verifier subscription PRO dans chaque route

- [ ] **Task 3: Creer le service ExportService** (AC: #1-3)
  - [ ] 3.1 Creer `src/modules/exports/application/services/export.service.ts`
  - [ ] 3.2 Methode `generateSalesCSV(creatorId, dateRange)`
  - [ ] 3.3 Methode `generateCustomersCSV(creatorId)`
  - [ ] 3.4 Methode `generateProductsCSV(creatorId)`
  - [ ] 3.5 Utiliser streaming pour gros volumes

- [ ] **Task 4: Creer l'API route export PDF** (AC: #4)
  - [ ] 4.1 Creer `src/app/api/exports/report/route.ts`
  - [ ] 4.2 Installer @react-pdf/renderer
  - [ ] 4.3 Generer le PDF cote serveur

- [ ] **Task 5: Creer le template PDF** (AC: #4)
  - [ ] 5.1 Creer `src/modules/exports/infrastructure/templates/monthly-report.tsx`
  - [ ] 5.2 Sections: Header, Resume, Graphique, Top Produits, Clients
  - [ ] 5.3 Styling professionnel avec logo

- [ ] **Task 6: Creer les composants UI** (AC: #1-5)
  - [ ] 6.1 Creer `src/components/exports/export-card.tsx`
  - [ ] 6.2 Creer `src/components/exports/date-range-picker.tsx`
  - [ ] 6.3 Creer `src/components/exports/month-picker.tsx`

- [ ] **Task 7: Ecrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires ExportService
  - [ ] 7.2 Tests API routes (verification PRO, format CSV)
  - [ ] 7.3 Tests generation PDF

## Dev Notes

### Page Exports

```typescript
// src/app/(dashboard)/exports/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ExportCard } from '@/components/exports/export-card';
import { ProGate } from '@/components/subscription/pro-gate';
import { FileSpreadsheet, Users, Package, FileText } from 'lucide-react';

export default async function ExportsPage() {
  const session = await auth();

  if (!session?.user?.creatorId) {
    redirect('/become-creator');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { creatorId: session.user.creatorId },
    select: { plan: true },
  });

  const isPro = subscription?.plan === 'PRO';

  const exports = [
    {
      title: 'Export Ventes',
      description: 'Telecharger toutes vos ventes au format CSV',
      icon: FileSpreadsheet,
      href: '/api/exports/sales',
      hasDateFilter: true,
    },
    {
      title: 'Export Clients',
      description: 'Telecharger la liste de vos clients au format CSV',
      icon: Users,
      href: '/api/exports/customers',
      hasDateFilter: false,
    },
    {
      title: 'Export Produits',
      description: 'Telecharger vos produits avec leurs statistiques',
      icon: Package,
      href: '/api/exports/products',
      hasDateFilter: false,
    },
    {
      title: 'Rapport Mensuel PDF',
      description: 'Generer un rapport complet pour un mois donne',
      icon: FileText,
      href: '/api/exports/report',
      hasMonthFilter: true,
      isPdf: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Exports</h1>
        <p className="text-muted-foreground">
          Telecharger vos donnees et rapports
        </p>
      </div>

      {!isPro ? (
        <ProGate feature="exports de donnees">
          <ExportsGrid exports={exports} disabled />
        </ProGate>
      ) : (
        <ExportsGrid exports={exports} />
      )}
    </div>
  );
}

function ExportsGrid({
  exports,
  disabled = false
}: {
  exports: typeof exports;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {exports.map((exp) => (
        <ExportCard
          key={exp.title}
          title={exp.title}
          description={exp.description}
          icon={exp.icon}
          href={exp.href}
          hasDateFilter={exp.hasDateFilter}
          hasMonthFilter={exp.hasMonthFilter}
          isPdf={exp.isPdf}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
```

### Composant ExportCard

```typescript
// src/components/exports/export-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from './date-range-picker';
import { MonthPicker } from './month-picker';
import { Download, Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ExportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  hasDateFilter?: boolean;
  hasMonthFilter?: boolean;
  isPdf?: boolean;
  disabled?: boolean;
}

export function ExportCard({
  title,
  description,
  icon: Icon,
  href,
  hasDateFilter,
  hasMonthFilter,
  isPdf,
  disabled,
}: ExportCardProps) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [month, setMonth] = useState<Date | null>(null);

  const handleExport = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (hasDateFilter && dateRange) {
        params.set('from', dateRange.from.toISOString());
        params.set('to', dateRange.to.toISOString());
      }

      if (hasMonthFilter && month) {
        params.set('month', month.toISOString());
      }

      const url = `${href}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Telecharger le fichier
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')
        ?.match(/filename="(.+)"/)?.[1] || `export.${isPdf ? 'pdf' : 'csv'}`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Export error:', error);
      // Toast error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasDateFilter && (
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            disabled={disabled}
          />
        )}

        {hasMonthFilter && (
          <MonthPicker
            value={month}
            onChange={setMonth}
            disabled={disabled}
          />
        )}

        <Button
          onClick={handleExport}
          disabled={disabled || loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isPdf ? 'Generer PDF' : 'Telecharger CSV'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### API Route Export Ventes CSV

```typescript
// src/app/api/exports/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifier subscription PRO
  const subscription = await prisma.subscription.findUnique({
    where: { creatorId: session.user.creatorId },
    select: { plan: true },
  });

  if (subscription?.plan !== 'PRO') {
    return NextResponse.json(
      { error: 'PRO subscription required' },
      { status: 403 }
    );
  }

  // Parse date range
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

  // Fetch orders
  const orders = await prisma.order.findMany({
    where: {
      creatorId: session.user.creatorId,
      ...(from && to && {
        createdAt: { gte: from, lte: to },
      }),
    },
    include: {
      customer: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Format CSV
  const rows = orders.map((order) => ({
    'Date': order.createdAt.toISOString().split('T')[0],
    'Numero': order.orderNumber,
    'Client': order.customer.name,
    'Email': order.customer.email,
    'Produits': order.items
      .map((i) => `${i.product.name}${i.variant ? ` (${i.variant.name})` : ''} x${i.quantity}`)
      .join('; '),
    'Montant HT': (order.totalAmount.toNumber() - (order.taxAmount?.toNumber() ?? 0)).toFixed(2),
    'TVA': order.taxAmount?.toNumber().toFixed(2) ?? '0.00',
    'Montant TTC': order.totalAmount.toNumber().toFixed(2),
    'Statut': order.status,
  }));

  const csv = stringify(rows, { header: true });

  const filename = `ventes-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

### API Route Export PDF

```typescript
// src/app/api/exports/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { MonthlyReportPDF } from '@/modules/exports/infrastructure/templates/monthly-report';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.creatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifier subscription PRO
  const subscription = await prisma.subscription.findUnique({
    where: { creatorId: session.user.creatorId },
    select: { plan: true },
  });

  if (subscription?.plan !== 'PRO') {
    return NextResponse.json(
      { error: 'PRO subscription required' },
      { status: 403 }
    );
  }

  // Parse month
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');
  const month = monthParam ? new Date(monthParam) : new Date();

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Fetch data for report
  const [orders, topProducts, customerStats] = await Promise.all([
    prisma.order.findMany({
      where: {
        creatorId: session.user.creatorId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
      },
      include: {
        items: { include: { product: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          creatorId: session.user.creatorId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: {
        creatorId: session.user.creatorId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: { id: true },
    }),
  ]);

  // Get creator info
  const creator = await prisma.creator.findUnique({
    where: { id: session.user.creatorId },
    include: { user: { select: { name: true } } },
  });

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = customerStats.length;

  // Get product names for top products
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const reportData = {
    creatorName: creator?.user.name ?? 'Createur',
    businessName: creator?.businessName ?? '',
    month: startOfMonth,
    metrics: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      uniqueCustomers,
    },
    topProducts: topProducts.map((p) => ({
      name: productMap.get(p.productId) ?? 'Produit',
      quantity: p._sum.quantity ?? 0,
      revenue: p._sum.totalPrice?.toNumber() ?? 0,
    })),
    dailySales: calculateDailySales(orders, startOfMonth, endOfMonth),
  };

  // Generate PDF
  const pdfBuffer = await renderToBuffer(<MonthlyReportPDF data={reportData} />);

  const filename = `rapport-${month.toISOString().slice(0, 7)}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function calculateDailySales(orders: any[], start: Date, end: Date) {
  const dailyMap = new Map<string, number>();

  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + order.totalAmount.toNumber());
  });

  const days: Array<{ date: string; revenue: number }> = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    days.push({ date: dateStr, revenue: dailyMap.get(dateStr) ?? 0 });
    current.setDate(current.getDate() + 1);
  }

  return days;
}
```

### Template PDF Rapport Mensuel

```typescript
// src/modules/exports/infrastructure/templates/monthly-report.tsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  metricCard: {
    width: '48%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
  },
});

interface MonthlyReportPDFProps {
  data: {
    creatorName: string;
    businessName: string;
    month: Date;
    metrics: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      uniqueCustomers: number;
    };
    topProducts: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
    dailySales: Array<{ date: string; revenue: number }>;
  };
}

export function MonthlyReportPDF({ data }: MonthlyReportPDFProps) {
  const monthLabel = format(data.month, 'MMMM yyyy', { locale: fr });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rapport Mensuel</Text>
            <Text style={styles.subtitle}>
              {data.businessName || data.creatorName} - {monthLabel}
            </Text>
          </View>
        </View>

        {/* Metriques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Chiffre d'affaires</Text>
              <Text style={styles.metricValue}>{formatCurrency(data.metrics.totalRevenue)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Commandes</Text>
              <Text style={styles.metricValue}>{data.metrics.totalOrders}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Panier moyen</Text>
              <Text style={styles.metricValue}>{formatCurrency(data.metrics.averageOrderValue)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Clients uniques</Text>
              <Text style={styles.metricValue}>{data.metrics.uniqueCustomers}</Text>
            </View>
          </View>
        </View>

        {/* Top Produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Produits</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Produit</Text>
              <Text style={styles.tableCell}>Quantite</Text>
              <Text style={styles.tableCell}>CA</Text>
            </View>
            {data.topProducts.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{product.name}</Text>
                <Text style={styles.tableCell}>{product.quantity}</Text>
                <Text style={styles.tableCell}>{formatCurrency(product.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Genere le {format(new Date(), 'dd/MM/yyyy')} - Kpsull
        </Text>
      </Page>
    </Document>
  );
}
```

### Dependencies

```bash
bun add @react-pdf/renderer csv-stringify
```

### References

- [Source: architecture.md#Export Module]
- [Source: prd.md#FR19, FR20]
- [Source: epics.md#Story 10.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
