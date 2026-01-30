# Story 9.1: Integration AfterShip pour Suivi Automatique

Status: ready-for-dev

## Story

As a systeme,
I want suivre automatiquement les colis via AfterShip,
so that les statuts de livraison soient mis a jour en temps reel.

## Acceptance Criteria

1. **AC1 - Creation du tracking sur AfterShip**
   - **Given** une commande expediee avec tracking (status SHIPPED)
   - **When** le systeme enregistre l'expedition
   - **Then** un tracking est cree sur AfterShip avec le numero et le transporteur
   - **And** l'ID AfterShip est stocke dans la commande

2. **AC2 - Reception des webhooks AfterShip**
   - **Given** un colis enregistre sur AfterShip
   - **When** AfterShip envoie un webhook de mise a jour
   - **Then** le systeme traite le webhook et met a jour le statut de la commande
   - **And** les evenements de tracking sont journalises

3. **AC3 - Detection de livraison et mise a jour du statut**
   - **Given** un webhook AfterShip avec statut "Delivered"
   - **When** le systeme traite ce webhook
   - **Then** le statut Order passe a DELIVERED
   - **And** deliveredAt est defini avec l'horodatage de livraison
   - **And** validationDeadline = deliveredAt + 48h
   - **And** le client recoit une notification de livraison

4. **AC4 - Gestion des erreurs AfterShip**
   - **Given** une erreur lors de la creation du tracking
   - **When** l'API AfterShip echoue
   - **Then** l'erreur est journalisee
   - **And** une alerte est envoyee a l'admin
   - **And** le systeme retente avec backoff exponentiel

## Tasks / Subtasks

- [ ] **Task 1: Configurer le client AfterShip** (AC: #1, #4)
  - [ ] 1.1 Creer `src/lib/aftership/client.ts` avec configuration SDK
  - [ ] 1.2 Ajouter les variables d'environnement AFTERSHIP_API_KEY
  - [ ] 1.3 Implementer le circuit breaker pour la resilience

- [ ] **Task 2: Creer le port et l'adapter AfterShip** (AC: #1)
  - [ ] 2.1 Creer `src/modules/orders/application/ports/tracking.port.ts`
  - [ ] 2.2 Creer `src/modules/orders/infrastructure/aftership.adapter.ts`
  - [ ] 2.3 Implementer la methode registerShipment()
  - [ ] 2.4 Implementer le mapping des transporteurs (slug AfterShip)

- [ ] **Task 3: Creer le webhook handler AfterShip** (AC: #2, #3)
  - [ ] 3.1 Creer `src/app/api/webhooks/aftership/route.ts`
  - [ ] 3.2 Implementer la validation de signature webhook
  - [ ] 3.3 Parser les differents types d'evenements tracking

- [ ] **Task 4: Creer le use case de mise a jour du tracking** (AC: #3)
  - [ ] 4.1 Creer `src/modules/orders/application/use-cases/update-tracking-status.use-case.ts`
  - [ ] 4.2 Implementer la logique de transition SHIPPED -> DELIVERED
  - [ ] 4.3 Calculer validationDeadline = deliveredAt + 48h

- [ ] **Task 5: Integrer avec le use case d'expedition** (AC: #1)
  - [ ] 5.1 Modifier `ship-order.use-case.ts` pour appeler AfterShip
  - [ ] 5.2 Stocker aftershipTrackingId dans Order

- [ ] **Task 6: Notifications de livraison** (AC: #3)
  - [ ] 6.1 Creer template email "Commande livree"
  - [ ] 6.2 Envoyer notification au client avec lien suivi

- [ ] **Task 7: Ecrire les tests** (AC: #1-4)
  - [ ] 7.1 Tests unitaires pour AfterShip adapter
  - [ ] 7.2 Tests unitaires pour update-tracking-status use case
  - [ ] 7.3 Tests integration pour le webhook handler

## Dev Notes

### Configuration Client AfterShip

```typescript
// src/lib/aftership/client.ts
import AfterShip from 'aftership';

export const aftership = new AfterShip(process.env.AFTERSHIP_API_KEY!);

// Mapping des transporteurs
export const CARRIER_SLUGS: Record<string, string> = {
  'colissimo': 'colissimo',
  'mondial-relay': 'mondial-relay',
  'chronopost': 'chronopost',
  'ups': 'ups',
  'dhl': 'dhl-express',
  'fedex': 'fedex',
};
```

### Port Tracking

```typescript
// src/modules/orders/application/ports/tracking.port.ts
export interface RegisterShipmentParams {
  trackingNumber: string;
  carrier: string;
  orderId: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface TrackingStatus {
  tag: string;
  subtag?: string;
  deliveredAt?: Date;
}

export interface TrackingPort {
  registerShipment(params: RegisterShipmentParams): Promise<{
    id: string;
    status: string;
  }>;

  getStatus(trackingNumber: string, carrier: string): Promise<TrackingStatus>;
}
```

### Adapter AfterShip

```typescript
// src/modules/orders/infrastructure/aftership.adapter.ts
import { aftership, CARRIER_SLUGS } from '@/lib/aftership/client';
import { TrackingPort, RegisterShipmentParams, TrackingStatus } from '../application/ports/tracking.port';

export class AfterShipAdapter implements TrackingPort {
  async registerShipment(params: RegisterShipmentParams) {
    const slug = CARRIER_SLUGS[params.carrier] || params.carrier;

    const tracking = await aftership.tracking.createTracking({
      tracking_number: params.trackingNumber,
      slug,
      custom_fields: {
        order_id: params.orderId,
      },
      emails: params.customerEmail ? [params.customerEmail] : undefined,
      smses: params.customerPhone ? [params.customerPhone] : undefined,
    });

    return {
      id: tracking.tracking.id,
      status: tracking.tracking.tag,
    };
  }

  async getStatus(trackingNumber: string, carrier: string): Promise<TrackingStatus> {
    const slug = CARRIER_SLUGS[carrier] || carrier;

    const tracking = await aftership.tracking.getTracking({
      slug,
      tracking_number: trackingNumber,
    });

    return {
      tag: tracking.tracking.tag,
      subtag: tracking.tracking.subtag,
      deliveredAt: tracking.tracking.subtag === 'Delivered_001'
        ? new Date(tracking.tracking.last_updated_at)
        : undefined,
    };
  }
}
```

### Webhook Handler

```typescript
// src/app/api/webhooks/aftership/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { container } from '@/lib/container';
import { UpdateTrackingStatusUseCase } from '@/modules/orders/application/use-cases/update-tracking-status.use-case';

const AFTERSHIP_WEBHOOK_SECRET = process.env.AFTERSHIP_WEBHOOK_SECRET!;

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', AFTERSHIP_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('aftership-hmac-sha256') || '';

    // Verifier la signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid AfterShip webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Extraire les donnees
    const tracking = event.msg;
    const orderId = tracking.custom_fields?.order_id;

    if (!orderId) {
      console.warn('AfterShip webhook without order_id');
      return NextResponse.json({ received: true });
    }

    // Traiter l'evenement
    const updateTrackingUseCase = container.resolve(UpdateTrackingStatusUseCase);

    await updateTrackingUseCase.execute({
      orderId,
      trackingStatus: tracking.tag,
      trackingSubtag: tracking.subtag,
      deliveredAt: tracking.subtag === 'Delivered_001'
        ? new Date(tracking.last_updated_at)
        : undefined,
      checkpoints: tracking.checkpoints,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('AfterShip webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### Use Case Update Tracking Status

```typescript
// src/modules/orders/application/use-cases/update-tracking-status.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { EmailPort } from '../ports/email.port';
import { OrderStatus } from '../../domain/value-objects/order-status.vo';

export interface UpdateTrackingStatusInput {
  orderId: string;
  trackingStatus: string;
  trackingSubtag?: string;
  deliveredAt?: Date;
  checkpoints?: Array<{
    slug: string;
    message: string;
    checkpoint_time: string;
  }>;
}

export class UpdateTrackingStatusUseCase implements UseCase<UpdateTrackingStatusInput, void> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly emailService: EmailPort
  ) {}

  async execute(input: UpdateTrackingStatusInput): Promise<Result<void>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      return Result.fail('Order not found');
    }

    // 2. Verifier si c'est une livraison
    if (input.trackingSubtag === 'Delivered_001' && input.deliveredAt) {
      // Marquer comme livre
      const result = order.markAsDelivered(input.deliveredAt);
      if (result.isFailure) {
        return Result.fail(result.error!);
      }

      // Persister
      await this.orderRepository.save(order);

      // Envoyer notification client
      await this.emailService.sendOrderDeliveredEmail(order);

      console.log(`Order ${order.id.value} marked as DELIVERED, validation deadline: ${order.validationDeadline}`);
    }

    return Result.ok();
  }
}
```

### Order Entity - Methode markAsDelivered

```typescript
// Dans src/modules/orders/domain/entities/order.entity.ts

markAsDelivered(deliveredAt: Date): Result<void> {
  if (this.props.status.value !== OrderStatus.SHIPPED) {
    return Result.fail('Only shipped orders can be marked as delivered');
  }

  this.props.status = OrderStatusVO.create(OrderStatus.DELIVERED);
  this.props.deliveredAt = deliveredAt;

  // Calculer deadline de validation: +48h
  const validationDeadline = new Date(deliveredAt);
  validationDeadline.setHours(validationDeadline.getHours() + 48);
  this.props.validationDeadline = validationDeadline;

  return Result.ok();
}
```

### References

- [Source: architecture.md#AfterShip Integration]
- [Source: prd.md#FR42]
- [Source: epics.md#Story 9.1]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
