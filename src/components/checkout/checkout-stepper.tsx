'use client';

import { Check } from 'lucide-react';

type CheckoutStep = 'auth' | 'shipping' | 'carrier' | 'payment' | 'confirmation';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

const steps: { key: CheckoutStep; label: string; number: number }[] = [
  { key: 'shipping', label: 'Livraison', number: 1 },
  { key: 'carrier', label: 'Transporteur', number: 2 },
  { key: 'payment', label: 'Paiement', number: 3 },
  { key: 'confirmation', label: 'Confirmation', number: 4 },
];

export function CheckoutStepper({ currentStep, user }: CheckoutStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-6 font-sans">
      <nav aria-label="Étapes de commande">
        <ol className="flex items-center justify-center">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = step.key === currentStep;

            return (
              <li key={step.key} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 flex items-center justify-center border text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-black text-white border-black'
                        : isCompleted
                        ? 'bg-kpsull-green text-white border-kpsull-green'
                        : 'border-black/20 text-black/30'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.number}
                  </div>
                  <span
                    className={`hidden md:inline text-xs tracking-wider uppercase font-medium ${
                      isCurrent ? 'text-black' : isCompleted ? 'text-black/50' : 'text-black/25'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-8 lg:w-16 h-px mx-3 ${
                      index < currentIndex ? 'bg-black' : 'bg-black/15'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {user && (
        <p className="text-center text-xs text-black/50 tracking-wide">
          Connecté en tant que{' '}
          <span className="font-semibold text-black">{user.name ?? user.email}</span>
        </p>
      )}
    </div>
  );
}
