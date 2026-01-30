# Story 9.4: Initiation de Retour par le Client

Status: ready-for-dev

## Story

As a client,
I want initier un retour de commande,
so that je puisse etre rembourse si le produit ne me convient pas.

## Acceptance Criteria

1. **AC1 - Affichage du bouton de retour**
   - **Given** un client avec une commande en statut DELIVERED ou VALIDATION_PENDING
   - **When** il consulte les details de la commande
   - **Then** le bouton "Retourner la commande" est visible

2. **AC2 - Formulaire de retour**
   - **Given** un client qui clique sur "Retourner la commande"
   - **When** le formulaire s'affiche
   - **Then** il peut selectionner la raison du retour (Taille incorrecte, Ne correspond pas, Defectueux, Change d'avis, Autre)
   - **And** il peut selectionner les articles a retourner
   - **And** il peut ajouter un commentaire optionnel

3. **AC3 - Soumission du retour**
   - **Given** un formulaire de retour rempli et valide
   - **When** le client soumet le retour
   - **Then** le statut Order passe a RETURN_SHIPPED
   - **And** returnRequestedAt est defini
   - **And** les informations du retour sont enregistrees

4. **AC4 - Instructions de retour**
   - **Given** un retour initie
   - **When** le systeme confirme le retour
   - **Then** le client voit les instructions de retour (adresse, conditions)
   - **And** il recoit un email avec les memes instructions

5. **AC5 - Notification au createur**
   - **Given** un retour initie
   - **When** le systeme traite le retour
   - **Then** le createur recoit un email de notification
   - **And** le retour apparait dans sa liste de commandes

## Tasks / Subtasks

- [ ] **Task 1: Creer le modele Return** (AC: #3)
  - [ ] 1.1 Ajouter le modele Return dans schema.prisma
  - [ ] 1.2 Creer l'entite Return dans le domaine
  - [ ] 1.3 Creer les value objects (ReturnReason, ReturnStatus)

- [ ] **Task 2: Ajouter le bouton de retour sur la page commande** (AC: #1)
  - [ ] 2.1 Modifier `src/app/(client)/orders/[id]/page.tsx`
  - [ ] 2.2 Afficher le bouton conditionnellement

- [ ] **Task 3: Creer le formulaire de retour** (AC: #2)
  - [ ] 3.1 Creer `src/components/client/return-form.tsx`
  - [ ] 3.2 Implementer le select des raisons
  - [ ] 3.3 Implementer la selection des articles
  - [ ] 3.4 Valider le formulaire

- [ ] **Task 4: Creer le use case d'initiation de retour** (AC: #3)
  - [ ] 4.1 Creer `src/modules/orders/application/use-cases/initiate-return.use-case.ts`
  - [ ] 4.2 Verifier l'eligibilite
  - [ ] 4.3 Transition vers RETURN_SHIPPED

- [ ] **Task 5: Creer la Server Action** (AC: #3)
  - [ ] 5.1 Ajouter initiateReturn dans `src/app/(client)/orders/[id]/actions.ts`

- [ ] **Task 6: Page d'instructions de retour** (AC: #4)
  - [ ] 6.1 Creer composant ReturnInstructions
  - [ ] 6.2 Afficher l'adresse de retour du createur
  - [ ] 6.3 Afficher les conditions de retour

- [ ] **Task 7: Notifications** (AC: #4, #5)
  - [ ] 7.1 Creer template email "Instructions de retour" pour le client
  - [ ] 7.2 Creer template email "Retour initie" pour le createur

- [ ] **Task 8: Ecrire les tests** (AC: #1-5)
  - [ ] 8.1 Tests unitaires pour initiate-return use case
  - [ ] 8.2 Tests composant pour return-form
  - [ ] 8.3 Tests integration pour le flow complet

## Dev Notes

### Schema Prisma - Modele Return

```prisma
// Dans prisma/schema.prisma

enum ReturnReason {
  WRONG_SIZE
  NOT_AS_DESCRIBED
  DEFECTIVE
  CHANGED_MIND
  OTHER
}

enum ReturnStatus {
  REQUESTED
  SHIPPED
  RECEIVED
  APPROVED
  REJECTED
}

model Return {
  id            String        @id @default(cuid())
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  reason        ReturnReason
  status        ReturnStatus  @default(REQUESTED)
  comment       String?       @db.Text

  // Articles retournes (JSON: [{itemId, quantity}])
  items         Json

  // Suivi
  trackingNumber String?
  carrier        String?

  // Resolution
  receivedAt    DateTime?
  approvedAt    DateTime?
  rejectedAt    DateTime?
  rejectionReason String?     @db.Text

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([orderId])
  @@index([status])
  @@map("returns")
}
```

### Value Object ReturnReason

```typescript
// src/modules/orders/domain/value-objects/return-reason.vo.ts
export enum ReturnReason {
  WRONG_SIZE = 'WRONG_SIZE',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  DEFECTIVE = 'DEFECTIVE',
  CHANGED_MIND = 'CHANGED_MIND',
  OTHER = 'OTHER',
}

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  [ReturnReason.WRONG_SIZE]: 'Taille incorrecte',
  [ReturnReason.NOT_AS_DESCRIBED]: 'Ne correspond pas a la description',
  [ReturnReason.DEFECTIVE]: 'Article defectueux',
  [ReturnReason.CHANGED_MIND]: "J'ai change d'avis",
  [ReturnReason.OTHER]: 'Autre raison',
};
```

### Composant Formulaire de Retour

```typescript
// src/components/client/return-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { initiateReturn } from '@/app/(client)/orders/[id]/actions';
import { ReturnReason, RETURN_REASON_LABELS } from '@/modules/orders/domain/value-objects/return-reason.vo';

const returnSchema = z.object({
  reason: z.nativeEnum(ReturnReason),
  comment: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
  })).min(1, 'Selectionnez au moins un article'),
});

type ReturnFormData = z.infer<typeof returnSchema>;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface ReturnFormProps {
  orderId: string;
  orderItems: OrderItem[];
  onSuccess?: () => void;
}

export function ReturnForm({ orderId, orderItems, onSuccess }: ReturnFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
  });

  const toggleItem = (itemId: string, maxQuantity: number) => {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQuantity };
    });
  };

  const updateQuantity = (itemId: string, quantity: number, maxQuantity: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: Math.min(Math.max(1, quantity), maxQuantity),
    }));
  };

  const onSubmit = async (data: ReturnFormData) => {
    const items = Object.entries(selectedItems).map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }));

    if (items.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await initiateReturn({
        orderId,
        reason: data.reason,
        comment: data.comment,
        items,
      });

      if (result.success) {
        router.refresh();
        onSuccess?.();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selection des articles */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Articles a retourner *</span>
        </label>
        <div className="space-y-3">
          {orderItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedItems[item.id] ? 'border-primary bg-primary/5' : 'border-base-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleItem(item.id, item.quantity)}
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm opacity-70">
                    Prix unitaire: {formatPrice(item.price)}
                  </p>
                </div>
                {selectedItems[item.id] && item.quantity > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Quantite:</span>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={selectedItems[item.id]}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value), item.quantity)
                      }
                      className="input input-bordered input-sm w-20"
                    />
                    <span className="text-sm opacity-70">/ {item.quantity}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {Object.keys(selectedItems).length === 0 && (
          <span className="text-error text-sm mt-1">
            Selectionnez au moins un article
          </span>
        )}
      </div>

      {/* Raison du retour */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Raison du retour *</span>
        </label>
        <select
          {...register('reason')}
          className="select select-bordered w-full"
        >
          <option value="">Selectionnez une raison</option>
          {Object.entries(RETURN_REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.reason && (
          <span className="text-error text-sm">{errors.reason.message}</span>
        )}
      </div>

      {/* Commentaire */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Commentaire (optionnel)</span>
        </label>
        <textarea
          {...register('comment')}
          className="textarea textarea-bordered h-24"
          placeholder="Ajoutez des details si necessaire..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || Object.keys(selectedItems).length === 0}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? (
          <span className="loading loading-spinner"></span>
        ) : (
          'Demander le retour'
        )}
      </button>
    </form>
  );
}
```

### Server Action

```typescript
// Dans src/app/(client)/orders/[id]/actions.ts

interface InitiateReturnInput {
  orderId: string;
  reason: ReturnReason;
  comment?: string;
  items: Array<{ itemId: string; quantity: number }>;
}

export async function initiateReturn(input: InitiateReturnInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: 'Non authentifie' };
  }

  const initiateReturnUseCase = container.resolve(InitiateReturnUseCase);

  const result = await initiateReturnUseCase.execute({
    orderId: input.orderId,
    customerId: session.user.id,
    reason: input.reason,
    comment: input.comment,
    items: input.items,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.value };
}
```

### Use Case Initiate Return

```typescript
// src/modules/orders/application/use-cases/initiate-return.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { ReturnRepository } from '../ports/return.repository.port';
import { EmailPort } from '../ports/email.port';
import { ReturnReason } from '../../domain/value-objects/return-reason.vo';
import { Return } from '../../domain/entities/return.entity';

export interface InitiateReturnInput {
  orderId: string;
  customerId: string;
  reason: ReturnReason;
  comment?: string;
  items: Array<{ itemId: string; quantity: number }>;
}

export interface InitiateReturnOutput {
  returnId: string;
  returnAddress: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };
}

export class InitiateReturnUseCase implements UseCase<InitiateReturnInput, InitiateReturnOutput> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly returnRepository: ReturnRepository,
    private readonly emailService: EmailPort
  ) {}

  async execute(input: InitiateReturnInput): Promise<Result<InitiateReturnOutput>> {
    // 1. Charger la commande avec le createur
    const order = await this.orderRepository.findByIdWithCreator(input.orderId);
    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    // 2. Verifier que le client est bien l'acheteur
    if (order.buyerId !== input.customerId) {
      return Result.fail('Non autorise');
    }

    // 3. Verifier l'eligibilite au retour
    if (!order.canInitiateReturn()) {
      return Result.fail('Cette commande ne peut pas etre retournee');
    }

    // 4. Valider les articles
    const validItems = input.items.filter((item) => {
      const orderItem = order.items.find((oi) => oi.id === item.itemId);
      return orderItem && item.quantity <= orderItem.quantity;
    });

    if (validItems.length === 0) {
      return Result.fail('Aucun article valide selectionne');
    }

    // 5. Creer le retour
    const returnResult = Return.create({
      orderId: order.id.value,
      reason: input.reason,
      comment: input.comment,
      items: validItems,
    });

    if (returnResult.isFailure) {
      return Result.fail(returnResult.error!);
    }

    // 6. Mettre a jour le statut de la commande
    const initiateResult = order.initiateReturn();
    if (initiateResult.isFailure) {
      return Result.fail(initiateResult.error!);
    }

    // 7. Persister
    await this.returnRepository.save(returnResult.value);
    await this.orderRepository.save(order);

    // 8. Construire l'adresse de retour
    const returnAddress = {
      name: order.creator.brandName,
      address: order.creator.businessAddress || '',
      postalCode: '', // A extraire de businessAddress
      city: '',
      country: 'France',
    };

    // 9. Envoyer les emails
    await this.emailService.sendReturnInstructionsEmail(order, returnResult.value, returnAddress);
    await this.emailService.sendReturnNotificationToCreator(order, returnResult.value);

    return Result.ok({
      returnId: returnResult.value.id.value,
      returnAddress,
    });
  }
}
```

### Order Entity - Methodes Retour

```typescript
// Dans src/modules/orders/domain/entities/order.entity.ts

canInitiateReturn(): boolean {
  // Peut retourner si DELIVERED ou VALIDATION_PENDING (pas encore finalise)
  return [OrderStatus.DELIVERED, OrderStatus.VALIDATION_PENDING].includes(
    this.props.status.value
  );
}

initiateReturn(): Result<void> {
  if (!this.canInitiateReturn()) {
    return Result.fail('Cannot initiate return on this order');
  }

  this.props.status = OrderStatusVO.create(OrderStatus.RETURN_SHIPPED);
  this.props.returnRequestedAt = new Date();

  return Result.ok();
}
```

### Composant Instructions de Retour

```typescript
// src/components/client/return-instructions.tsx
interface ReturnAddress {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

interface ReturnInstructionsProps {
  returnAddress: ReturnAddress;
  orderId: string;
}

export function ReturnInstructions({ returnAddress, orderId }: ReturnInstructionsProps) {
  return (
    <div className="card bg-info/10 border border-info">
      <div className="card-body">
        <h2 className="card-title text-info">Instructions de retour</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Adresse de retour</h3>
            <div className="bg-base-100 p-4 rounded-lg">
              <p className="font-medium">{returnAddress.name}</p>
              <p>{returnAddress.address}</p>
              <p>{returnAddress.postalCode} {returnAddress.city}</p>
              <p>{returnAddress.country}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Conditions de retour</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Emballez soigneusement les articles dans leur emballage d'origine si possible</li>
              <li>Incluez une copie de votre bon de commande ou reference #{orderId.slice(0, 8)}</li>
              <li>Envoyez le colis en suivi pour pouvoir prouver l'envoi</li>
              <li>Conservez le numero de suivi jusqu'a confirmation du remboursement</li>
            </ul>
          </div>

          <div className="alert alert-warning">
            <span>
              Les frais de retour sont a votre charge sauf en cas d'article defectueux ou
              non conforme a la description.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### References

- [Source: architecture.md#Order Status]
- [Source: prd.md#FR45]
- [Source: epics.md#Story 9.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
