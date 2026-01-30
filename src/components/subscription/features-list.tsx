'use client';

import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FEATURE_LABELS,
  type PlanFeatures,
} from '@/modules/subscriptions/domain/plan-features';

interface FeaturesListProps {
  features: PlanFeatures;
  showLocked?: boolean;
}

export function FeaturesList({ features, showLocked = true }: FeaturesListProps) {
  const featureEntries = Object.entries(features) as [
    keyof PlanFeatures,
    boolean,
  ][];

  // Separate enabled and locked features
  const enabledFeatures = featureEntries.filter(([, enabled]) => enabled);
  const lockedFeatures = featureEntries.filter(([, enabled]) => !enabled);

  return (
    <div className="space-y-4">
      {/* Enabled Features */}
      <div className="space-y-2">
        {enabledFeatures.map(([key]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span>{FEATURE_LABELS[key]}</span>
          </div>
        ))}
      </div>

      {/* Locked Features */}
      {showLocked && lockedFeatures.length > 0 && (
        <div className="space-y-2 opacity-60">
          {lockedFeatures.map(([key]) => (
            <div
              key={key}
              className={cn('flex items-center gap-2 text-sm text-muted-foreground')}
            >
              <Lock className="h-4 w-4" />
              <span>{FEATURE_LABELS[key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
