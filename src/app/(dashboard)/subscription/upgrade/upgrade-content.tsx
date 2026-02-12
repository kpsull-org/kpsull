'use client';

import { useState } from 'react';
import { PricingTable } from '@/components/subscription/pricing-table';
import { PlanType } from '@/modules/subscriptions/domain/value-objects/plan.vo';
import { BillingInterval } from '@/modules/subscriptions/domain/plan-features';
import { createCheckoutSession } from './actions';

interface UpgradeContentProps {
  currentPlan: PlanType;
  userEmail: string;
  userId: string;
}

export function UpgradeContent({ currentPlan }: UpgradeContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanType, interval: BillingInterval) => {
    setIsLoading(true);
    setLoadingPlan(plan);
    setError(null);

    try {
      const result = await createCheckoutSession(plan, interval);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        setLoadingPlan(undefined);
        return;
      }

      if (result.url) {
        window.open(result.url, '_blank');
        setIsLoading(false);
        setLoadingPlan(undefined);
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
      setLoadingPlan(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      <PricingTable
        currentPlan={currentPlan}
        onSelectPlan={handleSelectPlan}
        isLoading={isLoading}
        loadingPlan={loadingPlan}
      />

      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>
          En passant a un plan superieur, vous acceptez nos{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Conditions d&apos;utilisation
          </a>{' '}
          et notre{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Politique de confidentialité
          </a>
          .
        </p>
        <p>
          Vous pouvez annuler votre abonnement à tout moment depuis votre espace abonnement.
        </p>
      </div>
    </div>
  );
}
