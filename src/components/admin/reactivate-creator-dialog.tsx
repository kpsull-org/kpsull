'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ReactivateCreatorDialogProps {
  creatorId: string;
  creatorName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReactivate: (creatorId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * ReactivateCreatorDialog
 *
 * Story 11-3: Desactivation compte
 *
 * Dialog component for reactivating a suspended creator account with mandatory reason.
 * Sends a mock email notification to the creator.
 *
 * Acceptance Criteria:
 * - AC1: Bouton suspendre/reactiver sur chaque createur
 * - AC2: Dialog de confirmation avec motif obligatoire
 * - AC3: Email notification au createur (mock)
 */
export function ReactivateCreatorDialog({
  creatorId,
  creatorName,
  open = false,
  onOpenChange,
  onReactivate,
}: ReactivateCreatorDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(open);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setReason('');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Le motif de reactivation est obligatoire');
      return;
    }

    startTransition(async () => {
      const result = await onReactivate(creatorId, reason.trim());

      if (result.success) {
        // Mock email notification logged to console
        console.log(`[MOCK EMAIL] Notification de reactivation envoyee a ${creatorName}:`, {
          to: `${creatorName}@example.com`,
          subject: 'Votre compte createur a ete reactive',
          body: `Votre compte a ete reactive. Motif: ${reason.trim()}`,
        });
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
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Reactiver le compte</CardTitle>
          <CardDescription>
            Createur: {creatorName}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reactivate-reason">
                Motif de reactivation <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="reactivate-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi vous reactivez ce compte createur..."
                disabled={isPending}
                className={cn(
                  'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
                  error && 'border-destructive'
                )}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Le createur sera notifie par email de la reactivation de son compte.
              Il pourra a nouveau vendre et acceder a son tableau de bord.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isPending || !reason.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reactivation en cours...
                  </>
                ) : (
                  'Confirmer la reactivation'
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
