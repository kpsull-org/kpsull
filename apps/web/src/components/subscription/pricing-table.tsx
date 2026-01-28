'use client';

import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  current?: boolean;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'FREE',
    price: '0€',
    period: '/mois',
    description: 'Pour démarrer',
    features: [
      { name: '5 produits maximum', included: true },
      { name: '10 ventes par mois', included: true },
      { name: 'Dashboard de base', included: true },
      { name: 'Support email', included: true },
      { name: 'Analytics avancés', included: false },
      { name: 'Export des rapports', included: false },
      { name: 'Support prioritaire', included: false },
      { name: 'Domaine personnalisé', included: false },
    ],
    cta: 'Plan actuel',
    current: true,
  },
  {
    name: 'PRO',
    price: '19€',
    period: '/mois',
    description: 'Pour les créateurs sérieux',
    features: [
      { name: 'Produits illimités', included: true },
      { name: 'Ventes illimitées', included: true },
      { name: 'Dashboard complet', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Analytics avancés', included: true },
      { name: 'Export des rapports', included: true },
      { name: 'Badges personnalisés', included: true },
      { name: 'Domaine personnalisé', included: true },
    ],
    cta: 'Passer à PRO',
    highlighted: true,
  },
];

interface PricingTableProps {
  currentPlan?: 'FREE' | 'PRO';
  onUpgrade?: () => void;
  isLoading?: boolean;
}

export function PricingTable({ currentPlan = 'FREE', onUpgrade, isLoading }: PricingTableProps) {
  const isPro = currentPlan === 'PRO';

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      {plans.map((plan) => {
        const isCurrent = plan.name === currentPlan;
        const canUpgrade = plan.name === 'PRO' && !isPro;

        return (
          <Card
            key={plan.name}
            className={cn(
              'relative',
              plan.highlighted && !isPro && 'border-primary shadow-lg',
              isCurrent && 'border-2 border-primary'
            )}
          >
            {plan.highlighted && !isPro && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Recommandé
              </Badge>
            )}

            {isCurrent && (
              <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                Plan actuel
              </Badge>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
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
                className="w-full"
                variant={canUpgrade ? 'default' : 'outline'}
                disabled={isCurrent || isPro || isLoading}
                onClick={canUpgrade ? onUpgrade : undefined}
              >
                {isLoading && canUpgrade ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection...
                  </>
                ) : canUpgrade ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {plan.cta}
                  </>
                ) : isCurrent ? (
                  'Plan actuel'
                ) : (
                  plan.cta
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
