'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: Step[] = [
  { id: 1, title: 'Informations', description: 'Informations professionnelles' },
  { id: 2, title: 'SIRET', description: 'Vérification SIRET' },
  { id: 3, title: 'Paiements', description: 'Configuration Stripe' },
];

interface OnboardingStepperProps {
  currentStep: number;
  className?: string;
}

export function OnboardingStepper({
  currentStep,
  className,
}: OnboardingStepperProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === ONBOARDING_STEPS.length - 1;

          return (
            <li
              key={step.id}
              className={cn('relative flex-1', !isLast && 'pr-4 sm:pr-8')}
            >
              <div className="flex items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary',
                    !isCompleted && !isCurrent && 'border-muted-foreground/50 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'ml-4 hidden h-0.5 w-full sm:block',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="mt-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-primary',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { ONBOARDING_STEPS };
