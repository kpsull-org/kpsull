'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsageProgress } from '@/components/subscription/usage-progress';
import { FeaturesList } from '@/components/subscription/features-list';
import { PlanBadge } from '@/components/subscription/plan-badge';
import { GetSubscriptionOutput } from '@/modules/subscriptions/application/use-cases/get-subscription.use-case';
import { Sparkles, Calendar, AlertTriangle, Crown } from 'lucide-react';
import { formatPrice } from '@/modules/subscriptions/domain/plan-features';

interface SubscriptionContentProps {
  subscription: GetSubscriptionOutput;
}

export function SubscriptionContent({ subscription }: SubscriptionContentProps) {
  const {
    plan,
    billingInterval,
    limits,
    usage,
    pricing,
    features,
    trial,
    canAddProduct,
    isNearProductLimit,
    currentPeriodEnd,
  } = subscription;

  const isEssentiel = plan === 'ESSENTIEL';
  const isStudio = plan === 'STUDIO';
  const isAtelier = plan === 'ATELIER';
  const canUpgrade = isEssentiel || isStudio;

  const showUpgradeWarning = !isAtelier && isNearProductLimit;
  const showLimitReached = !isAtelier && !canAddProduct;

  // Get upgrade target plan
  const upgradePlan = isEssentiel ? 'STUDIO' : isStudio ? 'ATELIER' : null;
  const upgradePlanLabel = isEssentiel ? 'Studio' : isStudio ? 'Atelier' : '';

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon abonnement</h1>
            <p className="text-muted-foreground">
              Gerez votre plan et consultez votre utilisation
            </p>
          </div>
          <PlanBadge plan={plan} size="lg" />
        </div>

        {/* Trial Banner */}
        {trial.isTrialing && trial.trialEnd && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">Periode d&apos;essai en cours</p>
                <p className="text-sm text-amber-600 mt-1">
                  Votre essai gratuit se termine le{' '}
                  {new Date(trial.trialEnd).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  . Votre carte sera debitee a la fin de la periode d&apos;essai.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Limit Warning */}
        {showLimitReached && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Limite atteinte</p>
                <p className="text-sm text-destructive/80 mt-1">
                  Vous avez atteint la limite de produits.{' '}
                  {canUpgrade && `Passez au plan ${upgradePlanLabel} pour plus de produits.`}
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
                  Vous approchez de votre limite
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Vos produits sont presque a la limite.{' '}
                  {canUpgrade && `Pensez a passer au plan ${upgradePlanLabel}.`}
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
              <CardDescription>Votre consommation actuelle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageProgress
                label="Produits"
                current={usage.productsUsed}
                limit={limits.productLimit}
              />
              <UsageProgress
                label="Produits mis en avant"
                current={usage.pinnedProductsUsed}
                limit={limits.pinnedProductsLimit}
              />

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission par vente</span>
                  <span className="font-medium">{(pricing.commissionRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Facturation</span>
                  <span className="font-medium">
                    {billingInterval === 'year' ? 'Annuelle' : 'Mensuelle'}
                  </span>
                </div>
              </div>

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
              <CardTitle>Fonctionnalites</CardTitle>
              <CardDescription>Disponibles avec votre plan {plan}</CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturesList features={features} showLocked={!isAtelier} />
            </CardContent>
          </Card>
        </div>

        {/* Upgrade CTA (for ESSENTIEL/STUDIO users) */}
        {canUpgrade && upgradePlan && (
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold">Passez au plan {upgradePlanLabel}</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {isEssentiel ? (
                  <>
                    Passez a 20 produits, accedez aux analytics avances, a l&apos;export de rapports
                    et reduisez votre commission a 4%.
                  </>
                ) : (
                  <>
                    Produits illimites, commission reduite a 3%, support prioritaire, domaine
                    personnalise et 14 jours d&apos;essai gratuit.
                  </>
                )}
              </p>
              <Button asChild className="mt-6" size="lg">
                <Link href="/subscription/upgrade">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Passer a {upgradePlanLabel} -{' '}
                  {formatPrice(
                    upgradePlan === 'STUDIO'
                      ? billingInterval === 'year'
                        ? 79000
                        : 7900
                      : billingInterval === 'year'
                        ? 95000
                        : 9500
                  )}
                  /{billingInterval === 'year' ? 'an' : 'mois'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ATELIER user info */}
        {isAtelier && (
          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="font-medium">Plan Atelier actif</p>
                <p className="text-sm text-muted-foreground">
                  Vous beneficiez de toutes les fonctionnalites premium avec la commission la plus
                  basse.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/subscription/manage">Gerer l&apos;abonnement</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
