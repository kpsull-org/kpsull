'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Package, CreditCard, Loader2, AlertCircle } from 'lucide-react';
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

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnId: string;
  orderNumber: string;
}

// =============================================================================
// APPROVE DIALOG
// =============================================================================

interface ApproveDialogProps extends BaseDialogProps {
  onApprove: (returnId: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * ApproveDialog Component
 *
 * Simple confirmation dialog for approving a return request.
 */
export function ApproveDialog({
  open,
  onOpenChange,
  returnId,
  orderNumber,
  onApprove,
}: ApproveDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await onApprove(returnId);
      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  if (!open) return null;

  return (
    <DialogWrapper onClose={handleClose}>
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <CloseButton onClick={handleClose} disabled={isPending} />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Approuver le retour</CardTitle>
          <CardDescription>Commande {orderNumber}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            En approuvant cette demande, le client sera notifie et pourra expedier
            le produit en retour.
          </p>

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleApprove} disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approbation en cours...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer l&apos;approbation
                </>
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
        </CardContent>
      </Card>
    </DialogWrapper>
  );
}

// =============================================================================
// REJECT DIALOG
// =============================================================================

interface RejectDialogProps extends BaseDialogProps {
  onReject: (returnId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * RejectDialog Component
 *
 * Dialog for rejecting a return request with mandatory reason.
 */
export function RejectDialog({
  open,
  onOpenChange,
  returnId,
  orderNumber,
  onReject,
}: RejectDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    setReason('');
    setError(null);
    onOpenChange(false);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Le motif de refus est obligatoire');
      return;
    }

    startTransition(async () => {
      const result = await onReject(returnId, reason.trim());
      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  if (!open) return null;

  return (
    <DialogWrapper onClose={handleClose}>
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <CloseButton onClick={handleClose} disabled={isPending} />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Refuser le retour</CardTitle>
          <CardDescription>Commande {orderNumber}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                Motif du refus <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi vous refusez cette demande de retour..."
                disabled={isPending}
                className={cn(
                  'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                  error && !reason.trim() && 'border-destructive'
                )}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Le client sera notifie du refus avec le motif indique.
            </p>

            {error && <ErrorMessage message={error} />}

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
                    Refus en cours...
                  </>
                ) : (
                  'Confirmer le refus'
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
    </DialogWrapper>
  );
}

// =============================================================================
// RECEIVE DIALOG
// =============================================================================

interface ReceiveDialogProps extends BaseDialogProps {
  onReceive: (returnId: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * ReceiveDialog Component
 *
 * Confirmation dialog for marking a return as received.
 */
export function ReceiveDialog({
  open,
  onOpenChange,
  returnId,
  orderNumber,
  onReceive,
}: ReceiveDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const handleReceive = () => {
    setError(null);
    startTransition(async () => {
      const result = await onReceive(returnId);
      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  if (!open) return null;

  return (
    <DialogWrapper onClose={handleClose}>
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <CloseButton onClick={handleClose} disabled={isPending} />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Confirmer la reception</CardTitle>
          <CardDescription>Commande {orderNumber}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Confirmez-vous avoir recu le produit retourne ? Vous pourrez ensuite
            proceder au remboursement.
          </p>

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleReceive} disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmation en cours...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Confirmer la reception
                </>
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
        </CardContent>
      </Card>
    </DialogWrapper>
  );
}

// =============================================================================
// REFUND DIALOG
// =============================================================================

interface RefundDialogProps extends BaseDialogProps {
  refundAmount: number;
  onRefund: (returnId: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * RefundDialog Component
 *
 * Confirmation dialog for processing a refund with amount display.
 */
export function RefundDialog({
  open,
  onOpenChange,
  returnId,
  orderNumber,
  refundAmount,
  onRefund,
}: RefundDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const handleRefund = () => {
    setError(null);
    startTransition(async () => {
      const result = await onRefund(returnId);
      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(refundAmount / 100);

  if (!open) return null;

  return (
    <DialogWrapper onClose={handleClose}>
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
        <CloseButton onClick={handleClose} disabled={isPending} />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Effectuer le remboursement</CardTitle>
          <CardDescription>Commande {orderNumber}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Montant a rembourser</p>
            <p className="text-2xl font-bold text-foreground">{formattedAmount}</p>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Le remboursement sera effectue sur le moyen de paiement original du client.
            Cette action est irreversible.
          </p>

          {error && <ErrorMessage message={error} />}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleRefund} disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Remboursement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Confirmer le remboursement
                </>
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
        </CardContent>
      </Card>
    </DialogWrapper>
  );
}

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

interface DialogWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
}

function DialogWrapper({ children, onClose }: DialogWrapperProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

interface CloseButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

function CloseButton({ onClick, disabled }: CloseButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute right-2 top-2"
      onClick={onClick}
      disabled={disabled}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Fermer</span>
    </Button>
  );
}

interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
