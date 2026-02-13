'use client';

import { AlertTriangle } from 'lucide-react';
import { CreatorActionDialog } from './creator-action-dialog';

interface SuspendCreatorDialogProps {
  creatorId: string;
  creatorName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuspend: (creatorId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export function SuspendCreatorDialog({
  creatorId,
  creatorName,
  open,
  onOpenChange,
  onSuspend,
}: SuspendCreatorDialogProps) {
  return (
    <CreatorActionDialog
      creatorId={creatorId}
      creatorName={creatorName}
      open={open}
      onOpenChange={onOpenChange}
      onAction={onSuspend}
      icon={AlertTriangle}
      iconClassName="text-destructive"
      iconContainerClassName="bg-destructive/10"
      title="Suspendre le compte"
      reasonLabel="Motif de suspension"
      reasonPlaceholder="Expliquez pourquoi vous suspendez ce compte createur..."
      reasonRequiredMessage="Le motif de suspension est obligatoire"
      description="Le createur sera notifie par email de la suspension de son compte. Il ne pourra plus vendre ni acceder a son tableau de bord."
      confirmLabel="Confirmer la suspension"
      pendingLabel="Suspension en cours..."
      confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      mockEmailAction="suspension"
      mockEmailSubject="Votre compte createur a ete suspendu"
      mockEmailBodyPrefix="Votre compte a ete suspendu pour la raison suivante: "
    />
  );
}
