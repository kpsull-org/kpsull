# Story 10.4: Analytics Avances (PRO)

Status: ready-for-dev

## Story

As a Createur PRO,
I want acceder aux analytics avances,
so that je puisse optimiser mes ventes avec des donnees detaillees.

## Acceptance Criteria

1. **AC1 - Taux de conversion**
   - **Given** un Createur PRO sur la page analytics
   - **When** il consulte les metriques de conversion
   - **Then** il voit: visiteurs uniques, ajouts panier, achats
   - **And** les taux de conversion entre chaque etape (funnel)

2. **AC2 - Top produits et categories**
   - **Given** un Createur PRO sur la page analytics
   - **When** il consulte les performances produits
   - **Then** il voit le classement des produits par CA et quantite
   - **And** les categories les plus performantes

3. **AC3 - Repartition geographique**
   - **Given** un Createur PRO avec des ventes
   - **When** il consulte la repartition geographique
   - **Then** il voit une carte ou un tableau des ventes par region/pays
   - **And** le CA et nombre de commandes par zone

4. **AC4 - Blocage pour FREE avec upgrade CTA**
   - **Given** un Createur FREE qui accede a /analytics
   - **When** la page se charge
   - **Then** il voit un apercu floute des analytics
   - **And** un message expliquant que c'est reserve aux PRO
   - **And** un bouton CTA "Passer a PRO" visible

5. **AC5 - Donnees de performance**
   - **Given** un Createur PRO sur analytics
   - **When** il consulte les performances
   - **Then** il voit les metriques de ses pages (vues, temps moyen)
   - **And** les sources de trafic (direct, recherche, reseaux sociaux)

## Tasks / Subtasks

- [ ] **Task 1: Creer la page analytics** (AC: #1-3, #5)
  - [ ] 1.1 Creer `src/app/(dashboard)/analytics/page.tsx`
  - [ ] 1.2 Verifier subscription PRO avant affichage
  - [ ] 1.3 Layout avec sections: Conversion, Produits, Geo, Performance

- [ ] **Task 2: Implementer le gate PRO** (AC: #4)
  - [ ] 2.1 Creer `src/components/subscription/pro-gate.tsx`
  - [ ] 2.2 Afficher l'apercu floute avec blur
  - [ ] 2.3 Overlay avec message et CTA upgrade

- [ ] **Task 3: Creer le composant ConversionFunnel** (AC: #1)
  - [ ] 3.1 Creer `src/components/analytics/conversion-funnel.tsx`
  - [ ] 3.2 Visualisation entonnoir avec pourcentages
  - [ ] 3.3 Tooltips explicatifs

- [ ] **Task 4: Creer le composant TopProducts** (AC: #2)
  - [ ] 4.1 Creer `src/components/analytics/top-products.tsx`
  - [ ] 4.2 Tableau avec classement par CA/quantite
  - [ ] 4.3 Toggle entre vues CA et quantite

- [ ] **Task 5: Creer le composant GeoDistribution** (AC: #3)
  - [ ] 5.1 Creer `src/components/analytics/geo-distribution.tsx`
  - [ ] 5.2 Tableau par region/pays avec CA et commandes
  - [ ] 5.3 Optionnel: carte interactive

- [ ] **Task 6: Creer le composant TrafficSources** (AC: #5)
  - [ ] 6.1 Creer `src/components/analytics/traffic-sources.tsx`
  - [ ] 6.2 Pie chart ou bar chart des sources
  - [ ] 6.3 Integration avec UTM params tracking

- [ ] **Task 7: Creer le service AdvancedAnalyticsService** (AC: #1-3, #5)
  - [ ] 7.1 Creer `src/modules/analytics/application/services/advanced-analytics.service.ts`
  - [ ] 7.2 Methodes pour chaque type d'analytics
  - [ ] 7.3 Agregations et calculs de taux

- [ ] **Task 8: Ecrire les tests** (AC: #1-5)
  - [ ] 8.1 Tests unitaires AdvancedAnalyticsService
  - [ ] 8.2 Tests composant ProGate
  - [ ] 8.3 Tests integration page analytics

## Dev Notes

### Page Analytics avec Gate PRO

```typescript
// src/app/(dashboard)/analytics/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProGate } from '@/components/subscription/pro-gate';
import { ConversionFunnel } from '@/components/analytics/conversion-funnel';
import { TopProducts } from '@/components/analytics/top-products';
import { GeoDistribution } from '@/components/analytics/geo-distribution';
import { TrafficSources } from '@/components/analytics/traffic-sources';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.creatorId) {
    redirect('/become-creator');
  }

  // Verifier subscription
  const subscription = await prisma.subscription.findUnique({
    where: { creatorId: session.user.creatorId },
    select: { plan: true },
  });

  const isPro = subscription?.plan === 'PRO';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Avances</h1>
        <p className="text-muted-foreground">
          Analyse detaillee de vos performances
        </p>
      </div>

      {!isPro ? (
        <ProGate feature="analytics avances">
          <AnalyticsContent creatorId={session.user.creatorId} blurred />
        </ProGate>
      ) : (
        <AnalyticsContent creatorId={session.user.creatorId} />
      )}
    </div>
  );
}

function AnalyticsContent({
  creatorId,
  blurred = false
}: {
  creatorId: string;
  blurred?: boolean;
}) {
  return (
    <div className={blurred ? 'blur-sm pointer-events-none select-none' : ''}>
      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionFunnel creatorId={creatorId} />
        <TopProducts creatorId={creatorId} />
        <GeoDistribution creatorId={creatorId} />
        <TrafficSources creatorId={creatorId} />
      </div>
    </div>
  );
}
```

### Composant ProGate

```typescript
// src/components/subscription/pro-gate.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
}

export function ProGate({ feature, children }: ProGateProps) {
  return (
    <div className="relative">
      {/* Contenu floute en arriere-plan */}
      {children}

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Fonctionnalite PRO
              </h3>
              <p className="text-muted-foreground">
                Les {feature} sont reserves aux createurs PRO.
                Passez a PRO pour debloquer toutes les fonctionnalites avancees.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild size="lg">
                <Link href="/subscription/upgrade">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Passer a PRO
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              A partir de 29€/mois
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Composant ConversionFunnel

```typescript
// src/components/analytics/conversion-funnel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { container } from '@/lib/container';
import { AdvancedAnalyticsService } from '@/modules/analytics/application/services/advanced-analytics.service';

interface ConversionFunnelProps {
  creatorId: string;
}

export async function ConversionFunnel({ creatorId }: ConversionFunnelProps) {
  const service = container.resolve(AdvancedAnalyticsService);
  const funnel = await service.getConversionFunnel(creatorId);

  const steps = [
    { name: 'Visiteurs', value: funnel.visitors, rate: 100 },
    {
      name: 'Ajouts panier',
      value: funnel.addToCart,
      rate: funnel.visitors > 0 ? (funnel.addToCart / funnel.visitors) * 100 : 0
    },
    {
      name: 'Checkout',
      value: funnel.checkout,
      rate: funnel.addToCart > 0 ? (funnel.checkout / funnel.addToCart) * 100 : 0
    },
    {
      name: 'Achats',
      value: funnel.purchases,
      rate: funnel.checkout > 0 ? (funnel.purchases / funnel.checkout) * 100 : 0
    },
  ];

  const overallRate = funnel.visitors > 0
    ? (funnel.purchases / funnel.visitors) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Entonnoir de Conversion</span>
          <span className="text-sm font-normal text-muted-foreground">
            Taux global: {overallRate.toFixed(2)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{step.name}</span>
                <span className="font-medium">
                  {step.value.toLocaleString()}
                  {index > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({step.rate.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(step.value / steps[0].value) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Composant TopProducts

```typescript
// src/components/analytics/top-products.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

interface TopProductsProps {
  products: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Produits</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">Par CA</TabsTrigger>
            <TabsTrigger value="quantity">Par Quantite</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <ProductList
              products={[...products].sort((a, b) => b.revenue - a.revenue)}
              metric="revenue"
            />
          </TabsContent>

          <TabsContent value="quantity">
            <ProductList
              products={[...products].sort((a, b) => b.quantity - a.quantity)}
              metric="quantity"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ProductList({
  products,
  metric,
}: {
  products: TopProductsProps['products'];
  metric: 'revenue' | 'quantity';
}) {
  const maxValue = Math.max(...products.map((p) => p[metric]));

  return (
    <div className="space-y-3">
      {products.slice(0, 10).map((product, index) => (
        <div key={product.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground w-4">{index + 1}.</span>
              <span className="truncate max-w-[200px]">{product.name}</span>
            </span>
            <span className="font-medium">
              {metric === 'revenue'
                ? formatCurrency(product.revenue)
                : `${product.quantity} vendus`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60"
              style={{ width: `${(product[metric] / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Service AdvancedAnalytics

```typescript
// src/modules/analytics/application/services/advanced-analytics.service.ts
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export interface ConversionFunnel {
  visitors: number;
  addToCart: number;
  checkout: number;
  purchases: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface GeoData {
  region: string;
  country: string;
  revenue: number;
  orders: number;
}

export class AdvancedAnalyticsService {
  async getConversionFunnel(creatorId: string, days: number = 30): Promise<ConversionFunnel> {
    const since = subDays(new Date(), days);

    // Note: Ces metriques necessitent un systeme de tracking (ex: analytics events)
    // Pour l'instant, on retourne des donnees basees sur les commandes
    const [visitors, cartEvents, checkoutEvents, purchases] = await Promise.all([
      // Visiteurs uniques (necessite tracking - placeholder)
      prisma.pageView.count({
        where: { creatorId, createdAt: { gte: since } },
      }).catch(() => 0),

      // Ajouts panier (depuis CartItem)
      prisma.cartItem.count({
        where: {
          cart: { creatorId },
          createdAt: { gte: since },
        },
      }),

      // Checkouts inities
      prisma.order.count({
        where: { creatorId, createdAt: { gte: since } },
      }),

      // Achats completes
      prisma.order.count({
        where: {
          creatorId,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
          createdAt: { gte: since },
        },
      }),
    ]);

    return {
      visitors: visitors || cartEvents * 5, // Estimation si pas de tracking
      addToCart: cartEvents,
      checkout: checkoutEvents,
      purchases,
    };
  }

  async getTopProducts(creatorId: string, limit: number = 10): Promise<ProductPerformance[]> {
    const products = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          creatorId,
          status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'] },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
    });

    const productDetails = await prisma.product.findMany({
      where: { id: { in: products.map((p) => p.productId) } },
      select: { id: true, name: true },
    });

    const productMap = new Map(productDetails.map((p) => [p.id, p.name]));

    return products
      .map((p) => ({
        id: p.productId,
        name: productMap.get(p.productId) || 'Produit inconnu',
        revenue: p._sum.totalPrice?.toNumber() ?? 0,
        quantity: p._sum.quantity ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getGeoDistribution(creatorId: string): Promise<GeoData[]> {
    const geoData = await prisma.$queryRaw<GeoData[]>`
      SELECT
        a.region,
        a.country,
        SUM(o."totalAmount")::float as revenue,
        COUNT(o.id)::int as orders
      FROM "Order" o
      INNER JOIN "Address" a ON o."shippingAddressId" = a.id
      WHERE o."creatorId" = ${creatorId}
        AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
      GROUP BY a.region, a.country
      ORDER BY revenue DESC
    `;

    return geoData;
  }

  async getTrafficSources(creatorId: string): Promise<Array<{ source: string; visits: number; conversions: number }>> {
    // Necessite un systeme de tracking UTM
    // Placeholder avec donnees simulees
    return [
      { source: 'Direct', visits: 1200, conversions: 45 },
      { source: 'Instagram', visits: 800, conversions: 32 },
      { source: 'Google', visits: 500, conversions: 18 },
      { source: 'Facebook', visits: 300, conversions: 12 },
      { source: 'Autres', visits: 200, conversions: 5 },
    ];
  }
}
```

### References

- [Source: architecture.md#Analytics Module]
- [Source: prd.md#FR17, FR18]
- [Source: epics.md#Story 10.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
