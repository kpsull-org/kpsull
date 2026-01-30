'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type DisputeTypeValue, DisputeType } from '@/modules/disputes/domain';

interface ReportIssueDialogProps {
  orderId: string;
  orderNumber: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (
    orderId: string,
    type: DisputeTypeValue,
    description: string
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * ReportIssueDialog
 *
 * Story 9-3: Signalement litige
 *
 * Dialog component for reporting an issue/dispute on a delivered order.
 *
 * Acceptance Criteria:
 * - AC1: Bouton "Signaler un probleme" sur commande livree
 * - AC2: Formulaire avec type de litige et description
 * - AC3: Creation entite Dispute avec statut OPEN
 */
export function ReportIssueDialog({
  orderId,
  orderNumber,
  open = false,
  onOpenChange,
  onSubmit,
}: ReportIssueDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(open);
  const [selectedType, setSelectedType] = useState<DisputeTypeValue | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disputeTypes = DisputeType.getAllTypes();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setSelectedType(null);
      setDescription('');
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedType) {
      setError('Veuillez selectionner un type de probleme');
      return;
    }

    if (!description.trim()) {
      setError('Veuillez decrire le probleme rencontre');
      return;
    }

    if (description.trim().length < 10) {
      setError('La description doit contenir au moins 10 caracteres');
      return;
    }

    startTransition(async () => {
      const result = await onSubmit(orderId, selectedType, description.trim());

      if (result.success) {
        handleOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => handleOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2"
          onClick={() => handleOpenChange(false)}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </Button>

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Signaler un probleme</CardTitle>
          <CardDescription>
            Commande {orderNumber}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selection */}
            <div className="space-y-2">
              <Label>
                Type de probleme <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {disputeTypes.map((type) => (
                  <label
                    key={type.value}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors',
                      selectedType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50',
                      isPending && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="disputeType"
                      value={type.value}
                      checked={selectedType === type.value}
                      onChange={() => setSelectedType(type.value)}
                      disabled={isPending}
                      className="h-4 w-4 text-primary"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description du probleme <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Decrivez precisement le probleme rencontre avec votre commande..."
                disabled={isPending}
                rows={4}
                className={cn(
                  'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
                  error && (!description.trim() || description.trim().length < 10) && 'border-destructive'
                )}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 caracteres
              </p>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Info text */}
            <p className="text-sm text-muted-foreground">
              Votre signalement sera examine par notre equipe. Vous serez informe de l&apos;avancement du traitement.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending || !selectedType || !description.trim()}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le signalement'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
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
