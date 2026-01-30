# Story 9.2: Liberation Automatique des Fonds apres 48h

Status: ready-for-dev

## Story

As a createur,
I want que mes fonds soient liberes 48h apres livraison,
so that je recoive mon paiement si le client ne conteste pas.

## Acceptance Criteria

1. **AC1 - Job de verification des commandes livrees**
   - **Given** des commandes en statut DELIVERED depuis plus de 48h
   - **When** le job de liberation s'execute
   - **Then** ces commandes sont identifiees pour liberation

2. **AC2 - Transition vers COMPLETED**
   - **Given** une commande DELIVERED eligible (validationDeadline depassee)
   - **When** la liberation est declenchee
   - **Then** le statut passe a COMPLETED
   - **And** completedAt est defini

3. **AC3 - Transfert Stripe vers le createur**
   - **Given** une commande passee en COMPLETED
   - **When** le transfert Stripe est cree
   - **Then** le montant transfere = total - platformFee (3%)
   - **And** stripeTransferId est enregistre dans la commande
   - **And** le createur recoit un email de confirmation de paiement

4. **AC4 - Mise a jour des stats createur**
   - **Given** un transfert reussi
   - **When** la commande est finalisee
   - **Then** totalRevenue du createur est incremente
   - **And** currentSalesCount de la Subscription est incremente

5. **AC5 - Gestion des erreurs de transfert**
   - **Given** une erreur lors du transfert Stripe
   - **When** le transfert echoue
   - **Then** l'erreur est journalisee
   - **And** une alerte est envoyee a l'admin
   - **And** le systeme reessaie ulterieurement

## Tasks / Subtasks

- [ ] **Task 1: Creer le job de liberation des fonds** (AC: #1)
  - [ ] 1.1 Creer `src/jobs/release-escrow.job.ts`
  - [ ] 1.2 Configurer le cron (toutes les 15 minutes)
  - [ ] 1.3 Implementer la requete pour trouver les commandes eligibles

- [ ] **Task 2: Creer le use case de liberation escrow** (AC: #2, #3, #4)
  - [ ] 2.1 Creer `src/modules/orders/application/use-cases/release-escrow.use-case.ts`
  - [ ] 2.2 Implementer la transition DELIVERED -> COMPLETED
  - [ ] 2.3 Integrer l'appel au service de paiement

- [ ] **Task 3: Implementer le transfert Stripe** (AC: #3)
  - [ ] 3.1 Ajouter methode releaseEscrow() dans PaymentPort
  - [ ] 3.2 Implementer dans StripeConnectAdapter
  - [ ] 3.3 Gerer les erreurs et retries

- [ ] **Task 4: Mettre a jour les statistiques** (AC: #4)
  - [ ] 4.1 Incrementer totalRevenue sur Creator
  - [ ] 4.2 Incrementer currentSalesCount sur Subscription
  - [ ] 4.3 Mettre a jour totalOrders sur Creator

- [ ] **Task 5: Notifications et emails** (AC: #3)
  - [ ] 5.1 Creer template email "Paiement recu"
  - [ ] 5.2 Envoyer notification au createur

- [ ] **Task 6: Gestion des erreurs** (AC: #5)
  - [ ] 6.1 Implementer le circuit breaker pour Stripe
  - [ ] 6.2 Logger les erreurs avec contexte complet
  - [ ] 6.3 Envoyer alerte admin en cas d'echec

- [ ] **Task 7: Ecrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires pour release-escrow use case
  - [ ] 7.2 Tests unitaires pour le job de liberation
  - [ ] 7.3 Tests integration avec mock Stripe

## Dev Notes

### Job de Liberation (Cron)

```typescript
// src/jobs/release-escrow.job.ts
import { prisma } from '@/lib/prisma/client';
import { container } from '@/lib/container';
import { ReleaseEscrowUseCase } from '@/modules/orders/application/use-cases/release-escrow.use-case';

export async function releaseEscrowJob() {
  console.log('[ReleaseEscrowJob] Starting...');

  try {
    // Trouver les commandes DELIVERED avec deadline depassee
    const eligibleOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        validationDeadline: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        orderNumber: true,
        validationDeadline: true,
      },
    });

    console.log(`[ReleaseEscrowJob] Found ${eligibleOrders.length} orders to release`);

    const releaseEscrowUseCase = container.resolve(ReleaseEscrowUseCase);

    for (const order of eligibleOrders) {
      try {
        const result = await releaseEscrowUseCase.execute({ orderId: order.id });

        if (result.isSuccess) {
          console.log(`[ReleaseEscrowJob] Released escrow for order ${order.orderNumber}`);
        } else {
          console.error(`[ReleaseEscrowJob] Failed to release order ${order.orderNumber}: ${result.error}`);
        }
      } catch (error) {
        console.error(`[ReleaseEscrowJob] Error processing order ${order.orderNumber}:`, error);
      }
    }

    console.log('[ReleaseEscrowJob] Completed');
  } catch (error) {
    console.error('[ReleaseEscrowJob] Job failed:', error);
    throw error;
  }
}

// Configuration cron (via next.js cron ou service externe)
// Executer toutes les 15 minutes: */15 * * * *
```

### Use Case Release Escrow

```typescript
// src/modules/orders/application/use-cases/release-escrow.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { PaymentPort } from '../ports/payment.port';
import { EmailPort } from '../ports/email.port';
import { CreatorRepository } from '@/modules/creators/application/ports/creator.repository.port';
import { SubscriptionRepository } from '@/modules/subscriptions/application/ports/subscription.repository.port';

export interface ReleaseEscrowInput {
  orderId: string;
}

export interface ReleaseEscrowOutput {
  orderId: string;
  transferId: string;
  amount: number;
}

export class ReleaseEscrowUseCase implements UseCase<ReleaseEscrowInput, ReleaseEscrowOutput> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentPort,
    private readonly emailService: EmailPort,
    private readonly creatorRepository: CreatorRepository,
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  async execute(input: ReleaseEscrowInput): Promise<Result<ReleaseEscrowOutput>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      return Result.fail('Order not found');
    }

    // 2. Verifier eligibilite
    if (!order.canReleaseEscrow()) {
      return Result.fail('Order is not eligible for escrow release');
    }

    // 3. Charger le createur
    const creator = await this.creatorRepository.findById(order.creatorId);
    if (!creator || !creator.stripeAccountId) {
      return Result.fail('Creator or Stripe account not found');
    }

    // 4. Calculer le montant a transferer
    const creatorPayout = order.creatorPayout;

    // 5. Effectuer le transfert Stripe
    try {
      const transfer = await this.paymentService.releaseEscrow(
        order.id.value,
        creatorPayout.amount,
        creator.stripeAccountId
      );

      // 6. Marquer la commande comme completee
      const completeResult = order.complete(transfer.id);
      if (completeResult.isFailure) {
        return Result.fail(completeResult.error!);
      }

      // 7. Persister la commande
      await this.orderRepository.save(order);

      // 8. Mettre a jour les stats du createur
      await this.creatorRepository.incrementRevenue(
        creator.id.value,
        creatorPayout.amount
      );

      // 9. Mettre a jour currentSalesCount sur subscription
      const subscription = await this.subscriptionRepository.findByCreatorId(creator.id.value);
      if (subscription) {
        subscription.incrementSalesCount();
        await this.subscriptionRepository.save(subscription);
      }

      // 10. Envoyer email au createur
      await this.emailService.sendPaymentReceivedEmail(order, creator, creatorPayout.amount);

      return Result.ok({
        orderId: order.id.value,
        transferId: transfer.id,
        amount: creatorPayout.amount,
      });
    } catch (error) {
      console.error('Stripe transfer failed:', error);
      return Result.fail('Payment transfer failed');
    }
  }
}
```

### Stripe Connect Adapter - Release Escrow

```typescript
// Dans src/modules/orders/infrastructure/stripe-connect.adapter.ts

async releaseEscrow(orderId: string, amount: number, stripeAccountId: string) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // Convertir en centimes
    currency: 'eur',
    destination: stripeAccountId,
    transfer_group: orderId,
    metadata: {
      orderId,
      type: 'escrow_release',
    },
  });

  return {
    id: transfer.id,
    amount: transfer.amount / 100,
    status: transfer.destination ? 'completed' : 'pending',
  };
}
```

### Order Entity - Methodes Escrow

```typescript
// Dans src/modules/orders/domain/entities/order.entity.ts

canReleaseEscrow(): boolean {
  // Doit etre DELIVERED
  if (this.props.status.value !== OrderStatus.DELIVERED) {
    return false;
  }

  // La deadline de validation doit etre depassee
  if (!this.props.validationDeadline) {
    return false;
  }

  return new Date() > this.props.validationDeadline;
}

complete(stripeTransferId: string): Result<void> {
  if (!this.canReleaseEscrow()) {
    return Result.fail('Order is not eligible for completion');
  }

  this.props.status = OrderStatusVO.create(OrderStatus.COMPLETED);
  this.props.stripeTransferId = stripeTransferId;
  this.props.completedAt = new Date();

  return Result.ok();
}

get creatorPayout(): Money {
  return this.props.creatorPayout;
}
```

### Email Template - Paiement Recu

```typescript
// src/modules/shared/infrastructure/emails/payment-received.email.tsx
import { Order } from '@/modules/orders/domain/entities/order.entity';
import { Creator } from '@/modules/creators/domain/entities/creator.entity';

interface PaymentReceivedEmailProps {
  order: Order;
  creator: Creator;
  amount: number;
}

export function PaymentReceivedEmail({ order, creator, amount }: PaymentReceivedEmailProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);

  return (
    <div>
      <h1>Paiement recu !</h1>
      <p>Bonjour {creator.brandName},</p>
      <p>
        Bonne nouvelle ! Les fonds de la commande #{order.orderNumber} ont ete liberes.
      </p>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <p><strong>Montant recu:</strong> {formatPrice(amount)}</p>
        <p><strong>Commande:</strong> #{order.orderNumber}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      <p>
        Le virement sera effectue sur votre compte bancaire sous 2-3 jours ouvrables.
      </p>
      <p>Merci de votre confiance !</p>
      <p>L'equipe Kpsull</p>
    </div>
  );
}
```

### Configuration API Route pour Cron

```typescript
// src/app/api/cron/release-escrow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { releaseEscrowJob } from '@/jobs/release-escrow.job';

// Verifier que l'appel vient du service cron (Vercel Cron, Railway, etc.)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verifier l'autorisation
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await releaseEscrowJob();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Job execution failed' },
      { status: 500 }
    );
  }
}
```

### References

- [Source: architecture.md#Stripe Connect Escrow]
- [Source: prd.md#FR43, FR47]
- [Source: epics.md#Story 9.2]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
