# Story 9.5: Validation du Retour et Remboursement

Status: ready-for-dev

## Story

As a createur,
I want valider la reception d'un retour,
so that le client soit rembourse.

## Acceptance Criteria

1. **AC1 - Affichage des retours en attente**
   - **Given** un createur sur sa page de commandes
   - **When** il filtre par statut "Retour en cours"
   - **Then** il voit les commandes avec statut RETURN_SHIPPED
   - **And** chaque commande affiche les details du retour demande

2. **AC2 - Confirmation de reception du retour**
   - **Given** un createur qui a recu un colis retour
   - **When** il clique sur "Confirmer reception retour"
   - **Then** le statut Order passe a RETURN_RECEIVED
   - **And** returnReceivedAt est defini

3. **AC3 - Validation et remboursement**
   - **Given** un createur qui a verifie le retour
   - **When** il clique sur "Valider le remboursement"
   - **Then** un refund Stripe 100% est declenche
   - **And** le statut Order passe a REFUNDED
   - **And** refundedAt est defini
   - **And** stripeRefundId est enregistre

4. **AC4 - Notification client du remboursement**
   - **Given** un remboursement effectue
   - **When** le refund Stripe est confirme
   - **Then** le client recoit un email de confirmation de remboursement
   - **And** l'email indique le montant et le delai de credit

5. **AC5 - Contestation du retour (non conforme)**
   - **Given** un createur qui recoit un retour non conforme
   - **When** il clique sur "Contester le retour"
   - **Then** un formulaire demande la raison et des preuves
   - **And** le litige est escalade a l'admin
   - **And** le createur et le client sont notifies

## Tasks / Subtasks

- [ ] **Task 1: Ajouter le filtre retours sur la page commandes createur** (AC: #1)
  - [ ] 1.1 Modifier `src/app/(dashboard)/orders/page.tsx`
  - [ ] 1.2 Ajouter le filtre "Retour en cours"
  - [ ] 1.3 Afficher les details du retour

- [ ] **Task 2: Creer le composant de gestion du retour** (AC: #2, #3)
  - [ ] 2.1 Creer `src/components/creator/return-management.tsx`
  - [ ] 2.2 Bouton "Confirmer reception"
  - [ ] 2.3 Bouton "Valider le remboursement"

- [ ] **Task 3: Creer le use case de confirmation de reception** (AC: #2)
  - [ ] 3.1 Creer `src/modules/orders/application/use-cases/confirm-return-received.use-case.ts`
  - [ ] 3.2 Transition RETURN_SHIPPED -> RETURN_RECEIVED

- [ ] **Task 4: Creer le use case de validation du remboursement** (AC: #3)
  - [ ] 4.1 Creer `src/modules/orders/application/use-cases/process-refund.use-case.ts`
  - [ ] 4.2 Appeler Stripe refund API
  - [ ] 4.3 Transition RETURN_RECEIVED -> REFUNDED

- [ ] **Task 5: Creer les Server Actions** (AC: #2, #3)
  - [ ] 5.1 Ajouter confirmReturnReceived action
  - [ ] 5.2 Ajouter processRefund action

- [ ] **Task 6: Implementer le refund Stripe** (AC: #3)
  - [ ] 6.1 Ajouter methode refund() dans PaymentPort
  - [ ] 6.2 Implementer dans StripeConnectAdapter

- [ ] **Task 7: Notifications client** (AC: #4)
  - [ ] 7.1 Creer template email "Remboursement confirme"
  - [ ] 7.2 Envoyer l'email avec details du remboursement

- [ ] **Task 8: Gestion de la contestation** (AC: #5)
  - [ ] 8.1 Creer formulaire de contestation
  - [ ] 8.2 Creer use case d'escalade vers admin
  - [ ] 8.3 Notifier les parties concernees

- [ ] **Task 9: Ecrire les tests** (AC: #1-5)
  - [ ] 9.1 Tests unitaires pour confirm-return-received use case
  - [ ] 9.2 Tests unitaires pour process-refund use case
  - [ ] 9.3 Tests integration avec mock Stripe refund

## Dev Notes

### Composant Gestion du Retour

```typescript
// src/components/creator/return-management.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmReturnReceived, processRefund, contestReturn } from '@/app/(dashboard)/orders/[id]/actions';

interface ReturnInfo {
  id: string;
  reason: string;
  reasonLabel: string;
  comment?: string;
  items: Array<{ itemId: string; name: string; quantity: number }>;
  status: string;
  createdAt: Date;
}

interface ReturnManagementProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  returnInfo: ReturnInfo;
  totalAmount: number;
}

export function ReturnManagement({
  orderId,
  orderNumber,
  orderStatus,
  returnInfo,
  totalAmount,
}: ReturnManagementProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showContestForm, setShowContestForm] = useState(false);

  const handleConfirmReceived = async () => {
    if (!confirm('Confirmez-vous avoir recu le colis retour ?')) return;

    setIsLoading(true);
    try {
      const result = await confirmReturnReceived({ orderId });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    const confirmed = confirm(
      `Vous allez rembourser ${formatPrice(totalAmount)} au client. Cette action est irreversible. Continuer ?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await processRefund({ orderId });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Retour demande</h2>

        {/* Details du retour */}
        <div className="space-y-2">
          <p><strong>Raison:</strong> {returnInfo.reasonLabel}</p>
          {returnInfo.comment && (
            <p><strong>Commentaire:</strong> {returnInfo.comment}</p>
          )}
          <p><strong>Date de demande:</strong> {new Date(returnInfo.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Articles retournes */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Articles concernes</h3>
          <ul className="list-disc list-inside">
            {returnInfo.items.map((item) => (
              <li key={item.itemId}>
                {item.name} x{item.quantity}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions selon le statut */}
        <div className="card-actions justify-end mt-6">
          {orderStatus === 'RETURN_SHIPPED' && (
            <>
              <button
                onClick={() => setShowContestForm(true)}
                className="btn btn-outline btn-warning"
                disabled={isLoading}
              >
                Contester le retour
              </button>
              <button
                onClick={handleConfirmReceived}
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  'Confirmer reception'
                )}
              </button>
            </>
          )}

          {orderStatus === 'RETURN_RECEIVED' && (
            <>
              <button
                onClick={() => setShowContestForm(true)}
                className="btn btn-outline btn-warning"
                disabled={isLoading}
              >
                Retour non conforme
              </button>
              <button
                onClick={handleProcessRefund}
                className="btn btn-success"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  `Valider le remboursement (${formatPrice(totalAmount)})`
                )}
              </button>
            </>
          )}
        </div>

        {/* Formulaire de contestation */}
        {showContestForm && (
          <ContestReturnForm
            orderId={orderId}
            onClose={() => setShowContestForm(false)}
            onSuccess={() => {
              setShowContestForm(false);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Formulaire de contestation
interface ContestReturnFormProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ContestReturnForm({ orderId, onClose, onSuccess }: ContestReturnFormProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) return;

    setIsSubmitting(true);
    try {
      const result = await contestReturn({
        orderId,
        reason,
        description,
        photos,
      });

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Contester le retour</h3>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Raison de la contestation *</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="select select-bordered"
              required
            >
              <option value="">Selectionnez une raison</option>
              <option value="INCOMPLETE">Articles manquants</option>
              <option value="DAMAGED">Articles endommages</option>
              <option value="USED">Articles utilises</option>
              <option value="WRONG_ITEMS">Mauvais articles</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description detaillee *</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered h-24"
              placeholder="Decrivez le probleme constate..."
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Photos (optionnel)</span>
            </label>
            <ImageUpload
              value={photos}
              onChange={setPhotos}
              maxImages={5}
              folder="return-contests"
            />
          </div>

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-warning"
              disabled={isSubmitting || !reason || !description}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Envoyer la contestation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Server Actions

```typescript
// src/app/(dashboard)/orders/[id]/actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { container } from '@/lib/container';
import { ConfirmReturnReceivedUseCase } from '@/modules/orders/application/use-cases/confirm-return-received.use-case';
import { ProcessRefundUseCase } from '@/modules/orders/application/use-cases/process-refund.use-case';
import { ContestReturnUseCase } from '@/modules/orders/application/use-cases/contest-return.use-case';

export async function confirmReturnReceived(input: { orderId: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.creatorId) {
    return { success: false, error: 'Non autorise' };
  }

  const useCase = container.resolve(ConfirmReturnReceivedUseCase);

  const result = await useCase.execute({
    orderId: input.orderId,
    creatorId: session.user.creatorId,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

export async function processRefund(input: { orderId: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.creatorId) {
    return { success: false, error: 'Non autorise' };
  }

  const useCase = container.resolve(ProcessRefundUseCase);

  const result = await useCase.execute({
    orderId: input.orderId,
    creatorId: session.user.creatorId,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.value };
}

export async function contestReturn(input: {
  orderId: string;
  reason: string;
  description: string;
  photos: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.creatorId) {
    return { success: false, error: 'Non autorise' };
  }

  const useCase = container.resolve(ContestReturnUseCase);

  const result = await useCase.execute({
    orderId: input.orderId,
    creatorId: session.user.creatorId,
    reason: input.reason,
    description: input.description,
    photos: input.photos,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
```

### Use Case Confirm Return Received

```typescript
// src/modules/orders/application/use-cases/confirm-return-received.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { ReturnRepository } from '../ports/return.repository.port';

export interface ConfirmReturnReceivedInput {
  orderId: string;
  creatorId: string;
}

export class ConfirmReturnReceivedUseCase implements UseCase<ConfirmReturnReceivedInput, void> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly returnRepository: ReturnRepository
  ) {}

  async execute(input: ConfirmReturnReceivedInput): Promise<Result<void>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    // 2. Verifier que le createur est bien le vendeur
    if (order.creatorId !== input.creatorId) {
      return Result.fail('Non autorise');
    }

    // 3. Verifier le statut
    if (order.status.value !== OrderStatus.RETURN_SHIPPED) {
      return Result.fail('Cette commande ne peut pas etre marquee comme retour recu');
    }

    // 4. Mettre a jour le statut
    const result = order.markReturnReceived();
    if (result.isFailure) {
      return Result.fail(result.error!);
    }

    // 5. Mettre a jour le Return
    const returnEntity = await this.returnRepository.findByOrderId(input.orderId);
    if (returnEntity) {
      returnEntity.markAsReceived();
      await this.returnRepository.save(returnEntity);
    }

    // 6. Persister
    await this.orderRepository.save(order);

    return Result.ok();
  }
}
```

### Use Case Process Refund

```typescript
// src/modules/orders/application/use-cases/process-refund.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { PaymentPort } from '../ports/payment.port';
import { EmailPort } from '../ports/email.port';

export interface ProcessRefundInput {
  orderId: string;
  creatorId: string;
}

export interface ProcessRefundOutput {
  refundId: string;
  amount: number;
}

export class ProcessRefundUseCase implements UseCase<ProcessRefundInput, ProcessRefundOutput> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentPort,
    private readonly emailService: EmailPort
  ) {}

  async execute(input: ProcessRefundInput): Promise<Result<ProcessRefundOutput>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findByIdWithBuyer(input.orderId);
    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    // 2. Verifier que le createur est bien le vendeur
    if (order.creatorId !== input.creatorId) {
      return Result.fail('Non autorise');
    }

    // 3. Verifier le statut
    if (order.status.value !== OrderStatus.RETURN_RECEIVED) {
      return Result.fail('Le retour doit etre confirme avant le remboursement');
    }

    // 4. Verifier qu'il y a un payment intent
    if (!order.stripePaymentIntentId) {
      return Result.fail('Aucun paiement associe a cette commande');
    }

    // 5. Effectuer le remboursement Stripe
    try {
      const refund = await this.paymentService.refund(order.stripePaymentIntentId);

      // 6. Mettre a jour le statut
      const result = order.markAsRefunded(refund.id);
      if (result.isFailure) {
        return Result.fail(result.error!);
      }

      // 7. Persister
      await this.orderRepository.save(order);

      // 8. Envoyer email au client
      await this.emailService.sendRefundConfirmationEmail(order, order.total.amount);

      return Result.ok({
        refundId: refund.id,
        amount: order.total.amount,
      });
    } catch (error) {
      console.error('Refund failed:', error);
      return Result.fail('Le remboursement a echoue');
    }
  }
}
```

### Stripe Connect Adapter - Refund

```typescript
// Dans src/modules/orders/infrastructure/stripe-connect.adapter.ts

async refund(paymentIntentId: string, amount?: number) {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  // Si montant specifie, remboursement partiel
  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  const refund = await stripe.refunds.create(refundParams);

  return {
    id: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
  };
}
```

### Order Entity - Methodes Refund

```typescript
// Dans src/modules/orders/domain/entities/order.entity.ts

markReturnReceived(): Result<void> {
  if (this.props.status.value !== OrderStatus.RETURN_SHIPPED) {
    return Result.fail('Order must be in RETURN_SHIPPED status');
  }

  this.props.status = OrderStatusVO.create(OrderStatus.RETURN_RECEIVED);
  this.props.returnReceivedAt = new Date();

  return Result.ok();
}

markAsRefunded(stripeRefundId: string): Result<void> {
  if (this.props.status.value !== OrderStatus.RETURN_RECEIVED) {
    return Result.fail('Order must be in RETURN_RECEIVED status');
  }

  this.props.status = OrderStatusVO.create(OrderStatus.REFUNDED);
  this.props.stripeRefundId = stripeRefundId;
  this.props.refundedAt = new Date();

  return Result.ok();
}
```

### Email Template - Confirmation de Remboursement

```typescript
// src/modules/shared/infrastructure/emails/refund-confirmation.email.tsx
interface RefundConfirmationEmailProps {
  order: Order;
  amount: number;
}

export function RefundConfirmationEmail({ order, amount }: RefundConfirmationEmailProps) {
  return (
    <div>
      <h1>Remboursement confirme</h1>
      <p>Bonjour,</p>
      <p>
        Nous vous confirmons le remboursement de votre commande #{order.orderNumber}.
      </p>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <p><strong>Montant rembourse:</strong> {formatPrice(amount)}</p>
        <p><strong>Commande:</strong> #{order.orderNumber}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <p style={{ marginTop: '20px' }}>
        Le remboursement sera credite sur votre moyen de paiement original
        sous <strong>5 a 10 jours ouvrables</strong> selon votre banque.
      </p>

      <p>
        Si vous avez des questions, n'hesitez pas a nous contacter.
      </p>

      <p>L'equipe Kpsull</p>
    </div>
  );
}
```

### Use Case Contest Return (Escalade Admin)

```typescript
// src/modules/orders/application/use-cases/contest-return.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { ReturnRepository } from '../ports/return.repository.port';
import { EmailPort } from '../ports/email.port';
import { NotificationPort } from '../ports/notification.port';

export interface ContestReturnInput {
  orderId: string;
  creatorId: string;
  reason: string;
  description: string;
  photos: string[];
}

export class ContestReturnUseCase implements UseCase<ContestReturnInput, void> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly returnRepository: ReturnRepository,
    private readonly emailService: EmailPort,
    private readonly notificationService: NotificationPort
  ) {}

  async execute(input: ContestReturnInput): Promise<Result<void>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findByIdWithBuyer(input.orderId);
    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    // 2. Verifier que le createur est bien le vendeur
    if (order.creatorId !== input.creatorId) {
      return Result.fail('Non autorise');
    }

    // 3. Charger le retour
    const returnEntity = await this.returnRepository.findByOrderId(input.orderId);
    if (!returnEntity) {
      return Result.fail('Retour non trouve');
    }

    // 4. Mettre a jour le statut en litige
    order.openDispute();
    returnEntity.contest(input.reason, input.description, input.photos);

    // 5. Persister
    await this.orderRepository.save(order);
    await this.returnRepository.save(returnEntity);

    // 6. Notifier l'admin
    await this.notificationService.notifyAdmin({
      type: 'RETURN_CONTESTED',
      title: `Retour conteste - Commande #${order.orderNumber}`,
      message: `Le createur conteste le retour: ${input.reason}`,
      data: {
        orderId: order.id.value,
        returnId: returnEntity.id.value,
        reason: input.reason,
      },
    });

    // 7. Notifier le client
    await this.emailService.sendReturnContestedEmail(order, input.reason);

    // 8. Notifier le createur (confirmation)
    await this.emailService.sendContestConfirmationEmail(order);

    return Result.ok();
  }
}
```

### References

- [Source: architecture.md#Order Status]
- [Source: prd.md#FR46]
- [Source: epics.md#Story 9.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
