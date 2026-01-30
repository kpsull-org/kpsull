'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LimitStatus } from '@/modules/subscriptions/application/use-cases/check-limit.use-case';

interface LimitReachedModalProps {
  type: 'products' | 'sales';
  current: number;
  limit: number;
  status: LimitStatus;
  open?: boolean;
  onClose?: () => void;
}

/**
 * LimitReachedModal
 *
 * Modal displayed when a creator has reached their subscription limit.
 * Prompts user to upgrade to PRO plan.
 */
export function LimitReachedModal({
  type,
  current,
  limit,
  status,
  open = false,
  onClose,
}: LimitReachedModalProps) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Only show for BLOCKED status
  if (status !== LimitStatus.BLOCKED || !isOpen) {
    return null;
  }

  const typeLabel = type === 'products' ? 'produits' : 'ventes';
  const actionLabel = type === 'products' ? 'publier un nouveau produit' : 'accepter une nouvelle commande';

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </Button>

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Limite de {typeLabel} atteinte</CardTitle>
          <CardDescription>
            Vous ne pouvez pas {actionLabel}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous avez atteint la limite de <strong>{limit} {typeLabel}</strong> de votre plan FREE.
            {type === 'products'
              ? ' Passez à PRO pour publier un nombre illimité de produits.'
              : ' Passez à PRO pour accepter un nombre illimité de commandes.'}
          </p>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">
              Utilisation actuelle : {current}/{limit} {typeLabel}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/subscription/upgrade">
                <Sparkles className="mr-2 h-4 w-4" />
                Passer à PRO - 19€/mois
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleClose} className="w-full">
              Peut-être plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
