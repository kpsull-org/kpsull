'use client';

import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TrackingStatusValue } from '@/modules/shipping/domain/value-objects/tracking-status.vo';

/**
 * Tracking event data for the timeline
 */
export interface TrackingTimelineEvent {
  id: string;
  status: TrackingStatusValue;
  statusLabel: string;
  message: string;
  location: string | null;
  timestamp: Date;
}

/**
 * Props for the TrackingTimeline component
 */
export interface TrackingTimelineProps {
  /** The tracking number */
  trackingNumber: string;
  /** The carrier name */
  carrierName: string;
  /** Current tracking status */
  currentStatus: TrackingStatusValue;
  /** Label for the current status */
  currentStatusLabel: string;
  /** Estimated delivery date (if available) */
  estimatedDelivery?: Date | null;
  /** List of tracking events */
  events: TrackingTimelineEvent[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for status display
 */
const STATUS_CONFIG: Record<
  TrackingStatusValue,
  { icon: typeof Package; color: string; bgColor: string }
> = {
  PENDING: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  INFO_RECEIVED: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  IN_TRANSIT: { icon: Truck, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  OUT_FOR_DELIVERY: { icon: MapPin, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  DELIVERED: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100' },
  FAILED_ATTEMPT: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-100' },
  EXCEPTION: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-100' },
  EXPIRED: { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-100' },
};

/**
 * Badge variant based on status
 */
function getStatusBadgeVariant(
  status: TrackingStatusValue
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'DELIVERED':
      return 'default';
    case 'EXCEPTION':
    case 'FAILED_ATTEMPT':
      return 'destructive';
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Format a date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Format a date for estimated delivery
 */
function formatEstimatedDelivery(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

/**
 * TrackingTimeline Component
 *
 * Displays a timeline of tracking events for a shipment.
 * Shows the current status, carrier info, and chronological list of events.
 *
 * @example
 * ```tsx
 * <TrackingTimeline
 *   trackingNumber="1Z999AA10123456784"
 *   carrierName="UPS"
 *   currentStatus="IN_TRANSIT"
 *   currentStatusLabel="En transit"
 *   estimatedDelivery={new Date('2025-01-30')}
 *   events={[
 *     {
 *       id: '1',
 *       status: 'IN_TRANSIT',
 *       statusLabel: 'En transit',
 *       message: 'Colis en cours de livraison',
 *       location: 'Paris, France',
 *       timestamp: new Date(),
 *     },
 *   ]}
 * />
 * ```
 */
export function TrackingTimeline({
  trackingNumber,
  carrierName,
  currentStatus,
  currentStatusLabel,
  estimatedDelivery,
  events,
  className,
}: TrackingTimelineProps) {
  const currentConfig = STATUS_CONFIG[currentStatus];
  const CurrentIcon = currentConfig.icon;

  // Sort events by timestamp (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Suivi de livraison</CardTitle>
            <CardDescription className="mt-1">
              {carrierName} - {trackingNumber}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(currentStatus)}>{currentStatusLabel}</Badge>
        </div>

        {/* Current Status Summary */}
        <div
          className={cn(
            'mt-4 flex items-center gap-3 rounded-lg p-4',
            currentConfig.bgColor
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-white',
              currentConfig.color
            )}
          >
            <CurrentIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className={cn('font-medium', currentConfig.color)}>{currentStatusLabel}</p>
            {estimatedDelivery && currentStatus !== 'DELIVERED' && currentStatus !== 'EXPIRED' && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Livraison estimee: {formatEstimatedDelivery(estimatedDelivery)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Steps (simplified visual) */}
        <div className="mb-6">
          <TrackingProgress currentStatus={currentStatus} />
        </div>

        {/* Events Timeline */}
        <div className="relative space-y-0">
          {sortedEvents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun evenement de suivi disponible
            </p>
          ) : (
            sortedEvents.map((event, index) => {
              const config = STATUS_CONFIG[event.status];
              const Icon = config.icon;
              const isLast = index === sortedEvents.length - 1;
              const isFirst = index === 0;

              return (
                <div key={event.id} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        isFirst ? config.bgColor : 'bg-muted',
                        isFirst ? config.color : 'text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div className="absolute top-8 h-full w-0.5 bg-muted" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                    <p className={cn('font-medium', isFirst && config.color)}>
                      {event.message}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatDate(event.timestamp)}</span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Progress indicator showing delivery steps
 */
function TrackingProgress({ currentStatus }: { currentStatus: TrackingStatusValue }) {
  const steps = [
    { status: 'PENDING' as const, label: 'Prise en charge' },
    { status: 'IN_TRANSIT' as const, label: 'En transit' },
    { status: 'OUT_FOR_DELIVERY' as const, label: 'En livraison' },
    { status: 'DELIVERED' as const, label: 'Livre' },
  ];

  const statusOrder: Record<TrackingStatusValue, number> = {
    PENDING: 0,
    INFO_RECEIVED: 0,
    IN_TRANSIT: 1,
    OUT_FOR_DELIVERY: 2,
    DELIVERED: 3,
    FAILED_ATTEMPT: 2,
    EXCEPTION: 2,
    EXPIRED: 4,
  };

  const currentIndex = statusOrder[currentStatus];
  const hasException = currentStatus === 'EXCEPTION' || currentStatus === 'FAILED_ATTEMPT';

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  isCompleted && !hasException
                    ? 'border-green-500 bg-green-500 text-white'
                    : isCurrent && hasException
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-muted bg-background text-muted-foreground'
                )}
              >
                {isCompleted && !hasException ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent && hasException ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs',
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1',
                  index < currentIndex ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Skeleton loader for the TrackingTimeline
 */
export function TrackingTimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-60 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="mb-6 h-16 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
