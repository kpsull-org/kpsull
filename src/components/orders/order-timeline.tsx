import { Check, Clock, Package, Truck, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/format';

type TimelineEventType =
  | 'CREATED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'DISPUTE_OPENED'
  | 'RETURN_SHIPPED'
  | 'RETURN_RECEIVED'
  | 'REFUNDED';

interface TimelineEvent {
  type: TimelineEventType;
  timestamp: Date;
  details?: string;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

const EVENT_CONFIG: Record<
  TimelineEventType,
  { label: string; icon: typeof Clock; className: string }
> = {
  CREATED: { label: 'Commande creee', icon: Clock, className: 'text-gray-500' },
  PAID: { label: 'Paiement recu', icon: Check, className: 'text-blue-500' },
  SHIPPED: { label: 'Commande expediee', icon: Truck, className: 'text-purple-500' },
  DELIVERED: { label: 'Commande livree', icon: Package, className: 'text-green-500' },
  COMPLETED: { label: 'Commande terminee', icon: Check, className: 'text-green-600' },
  CANCELED: { label: 'Commande annulee', icon: XCircle, className: 'text-red-500' },
  DISPUTE_OPENED: { label: 'Litige ouvert', icon: AlertCircle, className: 'text-orange-500' },
  RETURN_SHIPPED: { label: 'Retour expedie', icon: RotateCcw, className: 'text-orange-500' },
  RETURN_RECEIVED: { label: 'Retour recu', icon: Package, className: 'text-orange-600' },
  REFUNDED: { label: 'Remboursement effectue', icon: Check, className: 'text-gray-500' },
};

export function OrderTimeline({ events }: OrderTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {sortedEvents.map((event, index) => {
            const config = EVENT_CONFIG[event.type] || {
              label: event.type,
              icon: Clock,
              className: 'text-gray-500',
            };
            const Icon = config.icon;
            const isLast = index === sortedEvents.length - 1;

            return (
              <div key={index} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${config.className}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-muted absolute top-8 bottom-0" />
                  )}
                </div>
                <div className="pb-4 flex-1">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </p>
                  {event.details && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
