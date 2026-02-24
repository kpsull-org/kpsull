'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, X, Loader2, AlertCircle, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type ReturnReasonValue } from '@/modules/returns/domain';
import type { ReturnItem } from '@/modules/returns/application/ports/return.repository.interface';

export interface ReturnableItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  price: number;
}

interface ReturnRequestDialogProps {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly deliveredAt: Date;
  readonly daysRemaining: number;
  readonly items: ReturnableItem[];
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onSubmit: (
    orderId: string,
    reason: ReturnReasonValue,
    returnItems: ReturnItem[],
    additionalNotes?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const RETURN_REASONS: Array<{ value: ReturnReasonValue; label: string }> = [
  { value: 'CHANGED_MIND', label: "J'ai change d'avis" },
  { value: 'DEFECTIVE', label: 'Produit defectueux' },
  { value: 'NOT_AS_DESCRIBED', label: 'Produit non conforme a la description' },
  { value: 'OTHER', label: 'Autre raison' },
];

/**
 * ReturnRequestDialog
 *
 * Dialog component for requesting a full or partial return on a delivered order.
 * Returns can only be requested within 14 days of delivery.
 */
export function ReturnRequestDialog({
  orderId,
  orderNumber,
  deliveredAt,
  daysRemaining,
  items,
  open = false,
  onOpenChange,
  onSubmit,
}: ReturnRequestDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(open);
  const [selectedReason, setSelectedReason] = useState<ReturnReasonValue | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Item selection state: itemId → { selected, quantity }
  const [itemSelections, setItemSelections] = useState<
    Record<string, { selected: boolean; quantity: number }>
  >(() =>
    Object.fromEntries(items.map((item) => [item.id, { selected: true, quantity: item.quantity }]))
  );

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setSelectedReason(null);
      setAdditionalNotes('');
      setError(null);
      setItemSelections(
        Object.fromEntries(
          items.map((item) => [item.id, { selected: true, quantity: item.quantity }])
        )
      );
    }
  };

  const toggleItem = (itemId: string) => {
    setItemSelections((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return { ...prev, [itemId]: { selected: !current.selected, quantity: current.quantity } };
    });
  };

  const setQuantity = (itemId: string, qty: number, maxQty: number) => {
    const clamped = Math.max(1, Math.min(qty, maxQty));
    setItemSelections((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return { ...prev, [itemId]: { selected: current.selected, quantity: clamped } };
    });
  };

  const selectedCount = Object.values(itemSelections).filter((s) => s.selected).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedReason) {
      setError('Veuillez selectionner une raison de retour');
      return;
    }

    if (selectedReason === 'OTHER' && !additionalNotes.trim()) {
      setError('Veuillez preciser la raison de votre retour');
      return;
    }

    if (selectedCount === 0) {
      setError('Veuillez selectionner au moins un article a retourner');
      return;
    }

    const returnItems: ReturnItem[] = items
      .filter((item) => itemSelections[item.id]?.selected)
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        quantity: itemSelections[item.id]?.quantity ?? item.quantity,
        price: item.price,
      }));

    startTransition(async () => {
      const result = await onSubmit(
        orderId,
        selectedReason,
        returnItems,
        additionalNotes.trim() || undefined
      );

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

  const formattedDeliveryDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(new Date(deliveredAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => handleOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <RotateCcw className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Demander un retour</CardTitle>
          <CardDescription>Commande {orderNumber}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Days remaining info */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Il vous reste{' '}
                <strong>
                  {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                </strong>{' '}
                pour demander un retour (livree le {formattedDeliveryDate})
              </span>
            </div>

            {/* Item selection */}
            <div className="space-y-2">
              <Label>
                Articles a retourner{' '}
                <span className="text-muted-foreground text-xs">
                  ({selectedCount}/{items.length} selectionne{selectedCount > 1 ? 's' : ''})
                </span>
              </Label>
              <div className="space-y-2 border rounded-md divide-y">
                {items.map((item) => {
                  const sel = itemSelections[item.id] ?? { selected: true, quantity: item.quantity };
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-start gap-3 p-3 transition-colors',
                        sel.selected ? 'bg-primary/5' : 'opacity-60'
                      )}
                    >
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={sel.selected}
                        onChange={() => toggleItem(item.id)}
                        disabled={isPending}
                        className="h-4 w-4 mt-0.5 text-primary cursor-pointer"
                      />
                      <label
                        htmlFor={`item-${item.id}`}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        {item.variantInfo && (
                          <p className="text-xs text-muted-foreground">{item.variantInfo}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {(item.price / 100).toFixed(2)} € × {item.quantity}
                        </p>
                      </label>

                      {/* Quantity selector (only when selected and qty > 1) */}
                      {sel.selected && item.quantity > 1 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, sel.quantity - 1, item.quantity)}
                            disabled={isPending || sel.quantity <= 1}
                            className="h-6 w-6 flex items-center justify-center border rounded hover:bg-muted disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm w-6 text-center">{sel.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, sel.quantity + 1, item.quantity)}
                            disabled={isPending || sel.quantity >= item.quantity}
                            className="h-6 w-6 flex items-center justify-center border rounded hover:bg-muted disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason selection */}
            <div className="space-y-2">
              <Label>
                Raison du retour <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {RETURN_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors',
                      selectedReason === reason.value
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50',
                      isPending && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={() => setSelectedReason(reason.value)}
                      disabled={isPending}
                      className="h-4 w-4 text-primary"
                    />
                    <span className="text-sm">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional notes */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">
                Commentaires
                {selectedReason === 'OTHER' && <span className="text-destructive"> *</span>}
              </Label>
              <textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Decrivez le probleme rencontre..."
                disabled={isPending}
                className={cn(
                  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
                  error &&
                    selectedReason === 'OTHER' &&
                    !additionalNotes.trim() &&
                    'border-destructive'
                )}
              />
            </div>

            {/* Error message */}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Info text */}
            <p className="text-sm text-muted-foreground">
              Une fois votre demande soumise, le createur disposera de 48h pour l&apos;examiner.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isPending || !selectedReason || selectedCount === 0}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Confirmer la demande de retour'
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
