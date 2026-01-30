'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReturnStatusValue } from '@/modules/returns/domain/value-objects/return-status.vo';

interface ReturnStatusBadgeProps {
  status: ReturnStatusValue;
  className?: string;
}

const STATUS_CONFIG: Record<
  ReturnStatusValue,
  {
    label: string;
    className: string;
  }
> = {
  REQUESTED: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  APPROVED: {
    label: 'Approuve',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  },
  SHIPPED_BACK: {
    label: 'Retour expedie',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  },
  RECEIVED: {
    label: 'Recu',
    className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
  },
  REFUNDED: {
    label: 'Rembourse',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  },
  REJECTED: {
    label: 'Refuse',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  },
};

/**
 * ReturnStatusBadge Component
 *
 * Displays a colored badge based on return status with French labels.
 */
export function ReturnStatusBadge({ status, className }: ReturnStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Get the French label for a return status
 */
export function getReturnStatusLabel(status: ReturnStatusValue): string {
  return STATUS_CONFIG[status].label;
}
