'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Package, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ReturnStatusValue } from '@/modules/returns/domain/value-objects/return-status.vo';
import type { ReturnReasonValue } from '@/modules/returns/domain/value-objects/return-reason.vo';

interface ReturnRequestCardProps {
  returnRequest: {
    id: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    reason: ReturnReasonValue;
    reasonDetails?: string;
    status: ReturnStatusValue;
    rejectionReason?: string;
    createdAt: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
  };
  onApprove: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (returnId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

const REASON_LABELS: Record<ReturnReasonValue, string> = {
  CHANGED_MIND: "Changement d'avis",
  DEFECTIVE: 'Produit defectueux',
  NOT_AS_DESCRIBED: 'Non conforme',
  OTHER: 'Autre raison',
};

const STATUS_CONFIG: Record<
  ReturnStatusValue,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  REQUESTED: { label: 'En attente', variant: 'secondary' },
  APPROVED: { label: 'Approuve', variant: 'default' },
  SHIPPED_BACK: { label: 'Retour en cours', variant: 'secondary' },
  RECEIVED: { label: 'Recu', variant: 'default' },
  REFUNDED: { label: 'Rembourse', variant: 'default' },
  REJECTED: { label: 'Refuse', variant: 'destructive' },
};

/**
 * ReturnRequestCard Component
 *
 * Story 9-5: Validation retour remboursement
 *
 * Displays a return request with approve/reject actions for creators.
 *
 * Acceptance Criteria:
 * - AC1: Page createur pour voir les demandes de retour
 * - AC2: Actions: Approuver ou Rejeter avec motif
 * - AC4: Affichage dans dashboard createur
 */
export function ReturnRequestCard({
  returnRequest,
  onApprove,
  onReject,
}: ReturnRequestCardProps) {
  const router = useRouter();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusConfig = STATUS_CONFIG[returnRequest.status];
  const reasonLabel = REASON_LABELS[returnRequest.reason];
  const isPendingStatus = returnRequest.status === 'REQUESTED';

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await onApprove(returnRequest.id);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rejectionReason.trim()) {
      setError('Le motif de refus est obligatoire');
      return;
    }

    startTransition(async () => {
      const result = await onReject(returnRequest.id, rejectionReason.trim());
      if (result.success) {
        setShowRejectForm(false);
        setRejectionReason('');
        router.refresh();
      } else {
        setError(result.error ?? "Une erreur s'est produite");
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Card className={cn(isPendingStatus && 'border-warning')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-medium">
                {returnRequest.orderNumber}
              </CardTitle>
            </div>
            <CardDescription>
              {returnRequest.customerName} ({returnRequest.customerEmail})
            </CardDescription>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reason */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Motif du retour
          </p>
          <p className="text-sm">
            {reasonLabel}
            {returnRequest.reasonDetails && (
              <span className="block text-muted-foreground mt-1">
                {returnRequest.reasonDetails}
              </span>
            )}
          </p>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Demande le {formatDate(returnRequest.createdAt)}</span>
        </div>

        {/* Rejection reason if rejected */}
        {returnRequest.status === 'REJECTED' && returnRequest.rejectionReason && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Motif du refus</p>
                <p className="text-muted-foreground">{returnRequest.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions for pending returns */}
        {isPendingStatus && (
          <div className="pt-2 space-y-3">
            {error && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}

            {!showRejectForm ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isPending}
                  className="flex-1"
                  variant="default"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Approuver
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isPending}
                  className="flex-1"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                  Refuser
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReject} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`reject-reason-${returnRequest.id}`}>
                    Motif du refus <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id={`reject-reason-${returnRequest.id}`}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquez pourquoi vous refusez cette demande..."
                    disabled={isPending}
                    className={cn(
                      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isPending || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirmer le refus'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                      setError(null);
                    }}
                    disabled={isPending}
                    variant="ghost"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Approved/Rejected timestamps */}
        {returnRequest.approvedAt && (
          <p className="text-sm text-muted-foreground">
            Approuve le {formatDate(returnRequest.approvedAt)}
          </p>
        )}
        {returnRequest.rejectedAt && (
          <p className="text-sm text-muted-foreground">
            Refuse le {formatDate(returnRequest.rejectedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
