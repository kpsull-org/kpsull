'use client';

import { useState } from 'react';
import { PricingTable } from '@/components/subscription/pricing-table';
import { PlanType } from '@/modules/subscriptions/domain/value-objects/plan.vo';
import { createCheckoutSession } from './actions';

interface UpgradeContentProps {
  currentPlan: PlanType;
  userEmail: string;
  userId: string;
}

export function UpgradeContent({ currentPlan }: UpgradeContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createCheckoutSession();

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
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
        onUpgrade={handleUpgrade}
        isLoading={isLoading}
      />

      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>
          En passant à PRO, vous acceptez nos{' '}
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
