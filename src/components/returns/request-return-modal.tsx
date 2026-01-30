'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, X, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ReturnReasonValue } from '@/modules/returns/domain/value-objects/return-reason.vo';

// =============================================================================
// TYPES
// =============================================================================

interface RequestReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  deliveredAt: Date;
  onSubmit: (
    orderId: string,
    reason: ReturnReasonValue,
    details?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RETURN_POLICY_DAYS = 14;

const RETURN_REASONS: Array<{ value: ReturnReasonValue; label: string; description: string }> = [
  {
    value: 'CHANGED_MIND',
    label: "J'ai change d'avis",
    description: 'Vous ne souhaitez plus le produit',
  },
  {
    value: 'DEFECTIVE',
    label: 'Produit defectueux',
    description: 'Le produit est endommage ou ne fonctionne pas',
  },
  {
    value: 'NOT_AS_DESCRIBED',
    label: 'Non conforme a la description',
    description: 'Le produit ne correspond pas a ce qui etait annonce',
  },
  {
    value: 'OTHER',
    label: 'Autre raison',
    description: 'Precisez dans les commentaires',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * RequestReturnModal Component
 *
 * Modal for customers to request a return on a delivered order.
 * Includes reason selection, optional details, and return policy information.
 */
export function RequestReturnModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  deliveredAt,
  onSubmit,
}: RequestReturnModalProps) {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<ReturnReasonValue | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calculate days remaining for return
  const deliveryDate = new Date(deliveredAt);
  const returnDeadline = new Date(deliveryDate);
  returnDeadline.setDate(returnDeadline.getDate() + RETURN_POLICY_DAYS);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((returnDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isReturnPeriodExpired = daysRemaining <= 0;

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedReason) {
      setError('Veuillez selectionner une raison de retour');
      return;
    }

    if (selectedReason === 'OTHER' && !details.trim()) {
      setError('Veuillez preciser la raison de votre retour');
      return;
    }

    if (isReturnPeriodExpired) {
      setError('Le delai de retour de 14 jours est depasse');
      return;
    }

    startTransition(async () => {
      const result = await onSubmit(orderId, selectedReason, details.trim() || undefined);

      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  const formattedDeliveryDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(deliveryDate);

  const formattedDeadline = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(returnDeadline);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2"
          onClick={handleClose}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </Button>

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <RotateCcw className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Demander un retour</CardTitle>
          <CardDescription>Commande {orderNumber}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Return policy info */}
            {!isReturnPeriodExpired ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant
                    {daysRemaining > 1 ? 's' : ''}
                  </p>
                  <p className="text-amber-700">
                    Commande livree le {formattedDeliveryDate}. Vous avez jusqu&apos;au{' '}
                    {formattedDeadline} pour demander un retour.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Delai de retour expire</p>
                  <p className="text-red-700">
                    Le delai de 14 jours pour demander un retour est depasse. La commande a ete
                    livree le {formattedDeliveryDate}.
                  </p>
                </div>
              </div>
            )}

            {/* Reason selection */}
            <div className="space-y-3">
              <Label>
                Raison du retour <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {RETURN_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={cn(
                      'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all',
                      selectedReason === reason.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-1'
                        : 'border-input hover:border-primary/50 hover:bg-muted/50',
                      (isPending || isReturnPeriodExpired) && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={() => setSelectedReason(reason.value)}
                      disabled={isPending || isReturnPeriodExpired}
                      className="mt-1 h-4 w-4 text-primary border-input focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-sm">{reason.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {reason.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Details textarea */}
            <div className="space-y-2">
              <Label htmlFor="return-details">
                Commentaires
                {selectedReason === 'OTHER' && <span className="text-destructive"> *</span>}
              </Label>
              <textarea
                id="return-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Decrivez le probleme rencontre ou ajoutez des details..."
                disabled={isPending || isReturnPeriodExpired}
                className={cn(
                  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                )}
              />
            </div>

            {/* Return policy note */}
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-muted-foreground">
                <p className="font-medium text-foreground">Politique de retour</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Delai de retour: {RETURN_POLICY_DAYS} jours apres livraison</li>
                  <li>Le createur dispose de 48h pour examiner votre demande</li>
                  <li>Les frais de retour sont a votre charge sauf produit defectueux</li>
                </ul>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isPending || !selectedReason || isReturnPeriodExpired}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer la demande de retour'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isPending}
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
