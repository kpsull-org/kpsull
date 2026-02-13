'use client';

import { CheckCircle } from 'lucide-react';
import { CreatorActionDialog } from './creator-action-dialog';

interface ReactivateCreatorDialogProps {
  creatorId: string;
  creatorName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReactivate: (creatorId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export function ReactivateCreatorDialog({
  creatorId,
  creatorName,
  open,
  onOpenChange,
  onReactivate,
}: ReactivateCreatorDialogProps) {
  return (
    <CreatorActionDialog
      creatorId={creatorId}
      creatorName={creatorName}
      open={open}
      onOpenChange={onOpenChange}
      onAction={onReactivate}
      icon={CheckCircle}
      iconClassName="text-green-600"
      iconContainerClassName="bg-green-100"
      title="Reactiver le compte"
      reasonLabel="Motif de reactivation"
      reasonPlaceholder="Expliquez pourquoi vous reactivez ce compte createur..."
      reasonRequiredMessage="Le motif de reactivation est obligatoire"
      description="Le createur sera notifie par email de la reactivation de son compte. Il pourra a nouveau vendre et acceder a son tableau de bord."
      confirmLabel="Confirmer la reactivation"
      pendingLabel="Reactivation en cours..."
      confirmClassName="bg-green-600 hover:bg-green-700 text-white"
    />
  );
}
