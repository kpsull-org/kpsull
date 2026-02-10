'use client';

import { Check, MapPin, CreditCard, Package } from 'lucide-react';

type CheckoutStep = 'auth' | 'shipping' | 'payment' | 'confirmation';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

const steps: { key: CheckoutStep; label: string; icon: React.ReactNode }[] = [
  { key: 'shipping', label: 'Livraison', icon: <MapPin className="h-5 w-5" /> },
  { key: 'payment', label: 'Paiement', icon: <CreditCard className="h-5 w-5" /> },
  { key: 'confirmation', label: 'Confirmation', icon: <Package className="h-5 w-5" /> },
];

/**
 * CheckoutStepper component
 *
 * Visual stepper showing checkout progress
 */
export function CheckoutStepper({ currentStep, user }: CheckoutStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center gap-4 md:gap-8">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = step.key === currentStep;

            return (
              <li key={step.key} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-kpsull-green bg-kpsull-green text-white'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : step.icon}
                  </div>
                  <span className="hidden md:inline font-medium font-sans">{step.label}</span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`hidden md:block w-12 lg:w-24 h-0.5 mx-4 ${
                      index < currentIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* User info banner if authenticated */}
      {user && (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground font-sans">
            Connecte en tant que{' '}
            <span className="font-medium text-foreground">
              {user.name ?? user.email}
            </span>
          </p>
        </div>
      )}

      {/* Content area - will be filled by child routes */}
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-muted-foreground font-sans">
          Cette etape sera implementee dans la Story 7-4 (Adresse de livraison)
        </p>
      </div>
    </div>
  );
}
