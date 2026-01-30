'use client';

import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils/format';
import type { EscrowStatus } from '@/modules/payments/application/use-cases';
import { ESCROW_RELEASE_DELAY_HOURS } from '@/modules/payments/application/use-cases';

interface EscrowStatusProps {
  status: EscrowStatus;
  releaseDate: Date | null;
  remainingHours: number | null;
  totalAmount: number;
  isCreatorView?: boolean;
}

const STATUS_CONFIG: Record<
  EscrowStatus,
  { label: string; icon: typeof Clock; className: string; badgeClass: string }
> = {
  NOT_DELIVERED: {
    label: 'En attente de livraison',
    icon: Clock,
    className: 'text-gray-500',
    badgeClass: 'bg-gray-100 text-gray-800',
  },
  PENDING_RELEASE: {
    label: 'Fonds en sequestre',
    icon: AlertCircle,
    className: 'text-orange-500',
    badgeClass: 'bg-orange-100 text-orange-800',
  },
  RELEASED: {
    label: 'Fonds liberes',
    icon: CheckCircle2,
    className: 'text-green-500',
    badgeClass: 'bg-green-100 text-green-800',
  },
};

/**
 * EscrowStatus Component
 *
 * Story 9-2: Liberation fonds 48h
 *
 * Displays the escrow status for an order, showing when funds will be released
 * to the creator.
 *
 * Acceptance Criteria:
 * - AC2: Display escrow status in order details
 * - AC3: Informative banner for creator about the delay
 */
export function EscrowStatus({
  status,
  releaseDate,
  remainingHours,
  totalAmount,
  isCreatorView = false,
}: EscrowStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Statut des fonds</CardTitle>
          <Badge className={config.badgeClass}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${config.className}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{formatCurrency(totalAmount)}</p>
            <p className="text-sm text-muted-foreground">
              {status === 'NOT_DELIVERED' && 'En attente de confirmation de livraison'}
              {status === 'PENDING_RELEASE' &&
                remainingHours !== null &&
                `Liberation dans ${remainingHours}h`}
              {status === 'RELEASED' && 'Disponible sur votre compte'}
            </p>
          </div>
        </div>

        {releaseDate && status !== 'NOT_DELIVERED' && (
          <div className="text-sm text-muted-foreground border-t pt-3">
            <p>
              {status === 'PENDING_RELEASE' ? 'Liberation prevue le ' : 'Libere le '}
              {formatDateTime(releaseDate)}
            </p>
          </div>
        )}

        {isCreatorView && status === 'PENDING_RELEASE' && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Delai de securite</AlertTitle>
            <AlertDescription>
              Les fonds sont retenus pendant {ESCROW_RELEASE_DELAY_HOURS}h apres la
              livraison pour permettre a l&apos;acheteur de signaler un eventuel probleme.
              Vous recevrez automatiquement le paiement a l&apos;issue de ce delai.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * EscrowBanner Component
 *
 * Story 9-2: Liberation fonds 48h
 *
 * Compact banner for showing escrow info in order list or header.
 *
 * Acceptance Criteria:
 * - AC3: Informative banner for creator about the delay
 */
export function EscrowBanner({
  status,
  remainingHours,
}: Pick<EscrowStatusProps, 'status' | 'remainingHours'>) {
  if (status === 'NOT_DELIVERED') {
    return null;
  }

  if (status === 'RELEASED') {
    return (
      <Alert variant="success" className="py-2">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Les fonds ont ete liberes et sont disponibles sur votre compte.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="py-2">
      <Clock className="h-4 w-4" />
      <AlertDescription>
        Les fonds seront liberes dans{' '}
        <span className="font-medium">{remainingHours}h</span>. Delai de securite de{' '}
        {ESCROW_RELEASE_DELAY_HOURS}h apres livraison.
      </AlertDescription>
    </Alert>
  );
}
