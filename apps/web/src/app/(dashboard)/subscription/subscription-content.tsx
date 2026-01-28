'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsageProgress } from '@/components/subscription/usage-progress';
import { FeaturesList } from '@/components/subscription/features-list';
import { PlanBadge } from '@/components/subscription/plan-badge';
import { GetSubscriptionOutput } from '@/modules/subscriptions/application/use-cases/get-subscription.use-case';
import { Sparkles, Calendar, AlertTriangle } from 'lucide-react';

interface SubscriptionContentProps {
  subscription: GetSubscriptionOutput;
}

export function SubscriptionContent({ subscription }: SubscriptionContentProps) {
  const {
    plan,
    limits,
    usage,
    features,
    canAddProduct,
    canMakeSale,
    isNearProductLimit,
    isNearSalesLimit,
    currentPeriodEnd,
  } = subscription;

  const isFree = plan === 'FREE';
  const showUpgradeWarning = isFree && (isNearProductLimit || isNearSalesLimit);
  const showLimitReached = isFree && (!canAddProduct || !canMakeSale);

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon abonnement</h1>
            <p className="text-muted-foreground">
              Gérez votre plan et consultez votre utilisation
            </p>
          </div>
          <PlanBadge plan={plan} size="lg" />
        </div>

        {/* Limit Warning */}
        {showLimitReached && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Limite atteinte</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {!canAddProduct && 'Vous avez atteint la limite de produits. '}
                  {!canMakeSale && 'Vous avez atteint la limite de ventes ce mois-ci. '}
                  Passez au plan PRO pour des fonctionnalités illimitées.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Near Limit Warning */}
        {showUpgradeWarning && !showLimitReached && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-300">
                  Vous approchez de vos limites
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  {isNearProductLimit && 'Vos produits sont presque à la limite. '}
                  {isNearSalesLimit && 'Vos ventes approchent de la limite mensuelle. '}
                  Pensez à passer au plan PRO.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisation</CardTitle>
              <CardDescription>
                Votre consommation actuelle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageProgress
                label="Produits"
                current={usage.productsUsed}
                limit={limits.productLimit}
              />
              <UsageProgress
                label="Ventes ce mois"
                current={usage.salesUsed}
                limit={limits.salesLimit}
              />

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Renouvellement le{' '}
                  {new Date(currentPeriodEnd).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités</CardTitle>
              <CardDescription>
                Disponibles avec votre plan {plan}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturesList features={features} showLocked={isFree} />
            </CardContent>
          </Card>
        </div>

        {/* Upgrade CTA (for FREE users) */}
        {isFree && (
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold">
                Passez au plan PRO
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Débloquez un nombre illimité de produits et de ventes, accédez
                aux analytics avancés, à l&apos;export de rapports et bien plus encore.
              </p>
              <Button asChild className="mt-6" size="lg">
                <Link href="/subscription/upgrade">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Passer à PRO - 19€/mois
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PRO user info */}
        {!isFree && (
          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="font-medium">Plan PRO actif</p>
                <p className="text-sm text-muted-foreground">
                  Vous bénéficiez de toutes les fonctionnalités premium.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/subscription/manage">Gérer l&apos;abonnement</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
