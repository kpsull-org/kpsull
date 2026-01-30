'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SuspendCreatorDialogProps {
  creatorId: string;
  creatorName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuspend: (creatorId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * SuspendCreatorDialog
 *
 * Story 11-3: Desactivation compte
 *
 * Dialog component for suspending a creator account with mandatory reason.
 * Sends a mock email notification to the creator.
 *
 * Acceptance Criteria:
 * - AC1: Bouton suspendre/reactiver sur chaque createur
 * - AC2: Dialog de confirmation avec motif obligatoire
 * - AC3: Email notification au createur (mock)
 */
export function SuspendCreatorDialog({
  creatorId,
  creatorName,
  open = false,
  onOpenChange,
  onSuspend,
}: SuspendCreatorDialogProps) {
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
      setError('Le motif de suspension est obligatoire');
      return;
    }

    startTransition(async () => {
      const result = await onSuspend(creatorId, reason.trim());

      if (result.success) {
        // Mock email notification logged to console
        console.log(`[MOCK EMAIL] Notification de suspension envoyee a ${creatorName}:`, {
          to: `${creatorName}@example.com`,
          subject: 'Votre compte createur a ete suspendu',
          body: `Votre compte a ete suspendu pour la raison suivante: ${reason.trim()}`,
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Suspendre le compte</CardTitle>
          <CardDescription>
            Createur: {creatorName}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">
                Motif de suspension <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="suspend-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi vous suspendez ce compte createur..."
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
              Le createur sera notifie par email de la suspension de son compte.
              Il ne pourra plus vendre ni acceder a son tableau de bord.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending || !reason.trim()}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suspension en cours...
                  </>
                ) : (
                  'Confirmer la suspension'
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
