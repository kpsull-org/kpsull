'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Loader2, Crown, Star, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlanType } from '@/modules/subscriptions/domain/value-objects/plan.vo';
import {
  PLAN_FEATURES,
  formatPrice,
  calculateYearlySavings,
  BillingInterval,
} from '@/modules/subscriptions/domain/plan-features';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: PlanType;
  name: string;
  icon: typeof Star;
  monthlyPrice: number;
  yearlyPrice: number;
  commission: string;
  description: string;
  features: PlanFeature[];
  trialDays?: number;
  highlighted?: boolean;
  gradient?: string;
}

const plans: Plan[] = [
  {
    id: 'ESSENTIEL',
    name: 'Essentiel',
    icon: Star,
    monthlyPrice: PLAN_FEATURES.ESSENTIEL.pricing.monthly,
    yearlyPrice: PLAN_FEATURES.ESSENTIEL.pricing.yearly,
    commission: '5%',
    description: 'Pour demarrer votre boutique',
    features: [
      { name: '10 produits maximum', included: true },
      { name: '3 produits mis en avant', included: true },
      { name: 'Dashboard de base', included: true },
      { name: 'Gestion des commandes', included: true },
      { name: 'Analytics avances', included: false },
      { name: 'Export des rapports', included: false },
      { name: 'Support prioritaire', included: false },
      { name: 'Domaine personnalise', included: false },
    ],
  },
  {
    id: 'STUDIO',
    name: 'Studio',
    icon: Gem,
    monthlyPrice: PLAN_FEATURES.STUDIO.pricing.monthly,
    yearlyPrice: PLAN_FEATURES.STUDIO.pricing.yearly,
    commission: '4%',
    description: 'Pour les createurs qui grandissent',
    features: [
      { name: '20 produits maximum', included: true },
      { name: '5 produits mis en avant', included: true },
      { name: 'Dashboard complet', included: true },
      { name: 'Gestion des commandes', included: true },
      { name: 'Analytics avances', included: true },
      { name: 'Export des rapports', included: true },
      { name: 'Support prioritaire', included: false },
      { name: 'Domaine personnalise', included: false },
    ],
    highlighted: true,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'ATELIER',
    name: 'Atelier',
    icon: Crown,
    monthlyPrice: PLAN_FEATURES.ATELIER.pricing.monthly,
    yearlyPrice: PLAN_FEATURES.ATELIER.pricing.yearly,
    commission: '3%',
    description: 'Pour les createurs professionnels',
    trialDays: 14,
    features: [
      { name: 'Produits illimites', included: true },
      { name: 'Mises en avant illimitees', included: true },
      { name: 'Dashboard complet', included: true },
      { name: 'Gestion des commandes', included: true },
      { name: 'Analytics avances', included: true },
      { name: 'Export des rapports', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Domaine personnalise', included: true },
    ],
    gradient: 'from-amber-500 to-orange-500',
  },
];

interface PricingTableProps {
  currentPlan?: PlanType;
  onSelectPlan?: (plan: PlanType, interval: BillingInterval) => void;
  isLoading?: boolean;
  loadingPlan?: PlanType;
}

export function PricingTable({
  currentPlan,
  onSelectPlan,
  isLoading,
  loadingPlan,
}: PricingTableProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('year');

  const planOrder: Record<PlanType, number> = {
    ESSENTIEL: 1,
    STUDIO: 2,
    ATELIER: 3,
  };

  const canUpgrade = (planId: PlanType) => {
    if (!currentPlan) return true;
    return planOrder[planId] > planOrder[currentPlan];
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border p-1 bg-muted/50">
          <Button
            variant={billingInterval === 'month' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setBillingInterval('month')}
          >
            Mensuel
          </Button>
          <Button
            variant={billingInterval === 'year' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setBillingInterval('year')}
          >
            Annuel
            <Badge variant="secondary" className="ml-2 text-xs">
              -2 mois
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const canSelectPlan = canUpgrade(plan.id);
          const isLoadingThis = isLoading && loadingPlan === plan.id;
          const price = billingInterval === 'year' ? plan.yearlyPrice : plan.monthlyPrice;
          const savings = calculateYearlySavings(plan.id);
          const Icon = plan.icon;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.highlighted && !isCurrent && 'border-primary shadow-lg scale-105',
                isCurrent && 'border-2 border-green-500'
              )}
            >
              {plan.highlighted && !isCurrent && (
                <Badge
                  className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r',
                    plan.gradient
                  )}
                >
                  Populaire
                </Badge>
              )}

              {isCurrent && (
                <Badge
                  variant="outline"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 border-green-500 text-green-600 bg-white"
                >
                  Plan actuel
                </Badge>
              )}

              {plan.trialDays && !isCurrent && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 right-4"
                >
                  {plan.trialDays}j gratuits
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <div
                  className={cn(
                    'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2',
                    plan.gradient
                      ? `bg-gradient-to-r ${plan.gradient} text-white`
                      : 'bg-blue-500 text-white'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{formatPrice(price)}</span>
                  <span className="text-muted-foreground">
                    /{billingInterval === 'year' ? 'an' : 'mois'}
                  </span>
                </div>
                {billingInterval === 'year' && (
                  <p className="text-sm text-green-600">
                    Economisez {formatPrice(savings)}/an
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Commission: {plan.commission} par vente
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col space-y-4">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          'text-sm',
                          !feature.included && 'text-muted-foreground'
                        )}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    'w-full',
                    plan.gradient && canSelectPlan && `bg-gradient-to-r ${plan.gradient}`
                  )}
                  variant={canSelectPlan && !isCurrent ? 'default' : 'outline'}
                  disabled={isCurrent || !canSelectPlan || isLoading}
                  onClick={() => canSelectPlan && onSelectPlan?.(plan.id, billingInterval)}
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : isCurrent ? (
                    'Plan actuel'
                  ) : canSelectPlan ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {currentPlan ? 'Passer a ' + plan.name : 'Choisir ' + plan.name}
                    </>
                  ) : (
                    'Plan inferieur'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
