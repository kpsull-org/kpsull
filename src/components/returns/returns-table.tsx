'use client';

import { useState } from 'react';
import { Check, X, Package, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReturnStatusBadge } from './return-status-badge';
import {
  ApproveDialog,
  RejectDialog,
  ReceiveDialog,
  RefundDialog,
} from './return-action-dialogs';
import type { ReturnStatusValue } from '@/modules/returns/domain/value-objects/return-status.vo';
import type { ReturnReasonValue } from '@/modules/returns/domain/value-objects/return-reason.vo';

// =============================================================================
// TYPES
// =============================================================================

export interface ReturnItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: ReturnReasonValue;
  reasonDetails?: string;
  status: ReturnStatusValue;
  refundAmount: number;
  createdAt: Date;
}

interface ReturnsTableProps {
  returns: ReturnItem[];
  onApprove: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (returnId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  onReceive: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  onRefund: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  onViewOrder?: (orderId: string) => void;
}

const REASON_LABELS: Record<ReturnReasonValue, string> = {
  CHANGED_MIND: "Changement d'avis",
  DEFECTIVE: 'Produit defectueux',
  NOT_AS_DESCRIBED: 'Non conforme',
  OTHER: 'Autre raison',
};

// =============================================================================
// RETURNS TABLE COMPONENT
// =============================================================================

/**
 * ReturnsTable Component
 *
 * Interactive table displaying return requests with action buttons.
 * Actions are displayed based on the current status of each return.
 */
export function ReturnsTable({
  returns,
  onApprove,
  onReject,
  onReceive,
  onRefund,
  onViewOrder,
}: ReturnsTableProps) {
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [dialogType, setDialogType] = useState<
    'approve' | 'reject' | 'receive' | 'refund' | null
  >(null);

  const openDialog = (returnItem: ReturnItem, type: typeof dialogType) => {
    setSelectedReturn(returnItem);
    setDialogType(type);
  };

  const closeDialog = () => {
    setSelectedReturn(null);
    setDialogType(null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (returns.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Aucune demande de retour</CardTitle>
          <CardDescription>
            Vous n&apos;avez pas encore recu de demandes de retour.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Demandes de retour</CardTitle>
          <CardDescription>
            Gerez les demandes de retour de vos clients
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Commande
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Motif
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnItem) => (
                  <tr
                    key={returnItem.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{returnItem.orderNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{returnItem.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {returnItem.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{REASON_LABELS[returnItem.reason]}</div>
                      {returnItem.reasonDetails && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {returnItem.reasonDetails}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ReturnStatusBadge status={returnItem.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(returnItem.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <ReturnActions
                          returnItem={returnItem}
                          onApprove={() => openDialog(returnItem, 'approve')}
                          onReject={() => openDialog(returnItem, 'reject')}
                          onReceive={() => openDialog(returnItem, 'receive')}
                          onRefund={() => openDialog(returnItem, 'refund')}
                          onViewOrder={onViewOrder}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y">
            {returns.map((returnItem) => (
              <div key={returnItem.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{returnItem.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {returnItem.customerName}
                    </div>
                  </div>
                  <ReturnStatusBadge status={returnItem.status} />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {REASON_LABELS[returnItem.reason]}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(returnItem.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <ReturnActions
                    returnItem={returnItem}
                    onApprove={() => openDialog(returnItem, 'approve')}
                    onReject={() => openDialog(returnItem, 'reject')}
                    onReceive={() => openDialog(returnItem, 'receive')}
                    onRefund={() => openDialog(returnItem, 'refund')}
                    onViewOrder={onViewOrder}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedReturn && (
        <>
          <ApproveDialog
            open={dialogType === 'approve'}
            onOpenChange={(open) => !open && closeDialog()}
            returnId={selectedReturn.id}
            orderNumber={selectedReturn.orderNumber}
            onApprove={onApprove}
          />

          <RejectDialog
            open={dialogType === 'reject'}
            onOpenChange={(open) => !open && closeDialog()}
            returnId={selectedReturn.id}
            orderNumber={selectedReturn.orderNumber}
            onReject={onReject}
          />

          <ReceiveDialog
            open={dialogType === 'receive'}
            onOpenChange={(open) => !open && closeDialog()}
            returnId={selectedReturn.id}
            orderNumber={selectedReturn.orderNumber}
            onReceive={onReceive}
          />

          <RefundDialog
            open={dialogType === 'refund'}
            onOpenChange={(open) => !open && closeDialog()}
            returnId={selectedReturn.id}
            orderNumber={selectedReturn.orderNumber}
            refundAmount={selectedReturn.refundAmount}
            onRefund={onRefund}
          />
        </>
      )}
    </>
  );
}

// =============================================================================
// RETURN ACTIONS COMPONENT
// =============================================================================

interface ReturnActionsProps {
  returnItem: ReturnItem;
  onApprove: () => void;
  onReject: () => void;
  onReceive: () => void;
  onRefund: () => void;
  onViewOrder?: (orderId: string) => void;
  compact?: boolean;
}

function ReturnActions({
  returnItem,
  onApprove,
  onReject,
  onReceive,
  onRefund,
  onViewOrder,
  compact = false,
}: ReturnActionsProps) {
  const { status } = returnItem;

  // Determine available actions based on status
  const canApprove = status === 'REQUESTED';
  const canReceive = status === 'SHIPPED_BACK';
  const canRefund = status === 'RECEIVED';

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <>
            <Button size="sm" onClick={onApprove}>
              <Check className="h-4 w-4 mr-1" />
              Approuver
            </Button>
            <Button size="sm" variant="outline" onClick={onReject}>
              <X className="h-4 w-4 mr-1" />
              Refuser
            </Button>
          </>
        )}

        {canReceive && (
          <Button size="sm" onClick={onReceive}>
            <Package className="h-4 w-4 mr-1" />
            Reception
          </Button>
        )}

        {canRefund && (
          <Button size="sm" onClick={onRefund}>
            <CreditCard className="h-4 w-4 mr-1" />
            Rembourser
          </Button>
        )}

        {onViewOrder && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewOrder(returnItem.orderId)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {canApprove && (
        <>
          <Button size="sm" onClick={onApprove}>
            <Check className="h-4 w-4 mr-1" />
            Approuver
          </Button>
          <Button size="sm" variant="outline" onClick={onReject}>
            <X className="h-4 w-4 mr-1" />
            Refuser
          </Button>
        </>
      )}

      {canReceive && (
        <Button size="sm" onClick={onReceive}>
          <Package className="h-4 w-4 mr-1" />
          Confirmer reception
        </Button>
      )}

      {canRefund && (
        <Button size="sm" onClick={onRefund}>
          <CreditCard className="h-4 w-4 mr-1" />
          Rembourser
        </Button>
      )}

      {onViewOrder && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onViewOrder(returnItem.orderId)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
