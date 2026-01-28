# Story 9.3: Signalement de Litige par le Client

Status: ready-for-dev

## Story

As a client,
I want signaler un probleme dans les 48h suivant la livraison,
so that je puisse contester avant la liberation des fonds.

## Acceptance Criteria

1. **AC1 - Affichage du bouton de signalement**
   - **Given** un client avec une commande en statut DELIVERED
   - **When** la commande est livree depuis moins de 48h
   - **Then** le bouton "Signaler un probleme" est visible
   - **And** un compte a rebours affiche le temps restant

2. **AC2 - Formulaire de signalement**
   - **Given** un client qui clique sur "Signaler un probleme"
   - **When** le formulaire s'affiche
   - **Then** il peut selectionner le type de probleme (Non recu, Article endommage, Article non conforme, Autre)
   - **And** il peut saisir une description detaillee
   - **And** il peut uploader des photos (max 5)

3. **AC3 - Soumission du litige**
   - **Given** un formulaire de litige rempli et valide
   - **When** le client soumet le litige
   - **Then** le statut Order passe a DISPUTE_OPENED
   - **And** disputeOpenedAt est defini
   - **And** les informations du litige sont enregistrees

4. **AC4 - Suspension de la liberation**
   - **Given** un litige ouvert sur une commande
   - **When** le job de liberation des fonds s'execute
   - **Then** cette commande est exclue de la liberation automatique

5. **AC5 - Notifications**
   - **Given** un litige soumis
   - **When** le systeme traite le litige
   - **Then** le createur recoit un email de notification
   - **And** l'admin recoit une notification dans le dashboard
   - **And** le client recoit un email de confirmation

6. **AC6 - Indisponibilite apres 48h**
   - **Given** une commande livree depuis plus de 48h
   - **When** le client consulte la commande
   - **Then** le bouton "Signaler un probleme" n'est plus visible
   - **And** un message indique que le delai est depasse

## Tasks / Subtasks

- [ ] **Task 1: Creer le modele Dispute** (AC: #3)
  - [ ] 1.1 Ajouter le modele Dispute dans schema.prisma
  - [ ] 1.2 Creer l'entite Dispute dans le domaine
  - [ ] 1.3 Creer les value objects (DisputeType, DisputeStatus)

- [ ] **Task 2: Creer la page de details commande client** (AC: #1, #6)
  - [ ] 2.1 Creer `src/app/(client)/orders/[id]/page.tsx`
  - [ ] 2.2 Afficher le statut et les informations de la commande
  - [ ] 2.3 Afficher le bouton conditionnellement (< 48h)
  - [ ] 2.4 Afficher le compte a rebours

- [ ] **Task 3: Creer le formulaire de signalement** (AC: #2)
  - [ ] 3.1 Creer `src/components/client/dispute-form.tsx`
  - [ ] 3.2 Implementer le select des types de probleme
  - [ ] 3.3 Implementer le champ description
  - [ ] 3.4 Implementer l'upload de photos (Cloudinary)
  - [ ] 3.5 Valider le formulaire

- [ ] **Task 4: Creer le use case d'ouverture de litige** (AC: #3, #4)
  - [ ] 4.1 Creer `src/modules/orders/application/use-cases/open-dispute.use-case.ts`
  - [ ] 4.2 Verifier l'eligibilite (DELIVERED + < 48h)
  - [ ] 4.3 Transition vers DISPUTE_OPENED

- [ ] **Task 5: Creer la Server Action** (AC: #3)
  - [ ] 5.1 Creer `src/app/(client)/orders/[id]/actions.ts`
  - [ ] 5.2 Implementer openDispute action

- [ ] **Task 6: Notifications** (AC: #5)
  - [ ] 6.1 Creer template email "Litige ouvert" pour le createur
  - [ ] 6.2 Creer template email "Confirmation litige" pour le client
  - [ ] 6.3 Creer notification in-app pour l'admin

- [ ] **Task 7: Modifier le job de liberation** (AC: #4)
  - [ ] 7.1 Exclure les commandes DISPUTE_OPENED du job

- [ ] **Task 8: Ecrire les tests** (AC: #1-6)
  - [ ] 8.1 Tests unitaires pour open-dispute use case
  - [ ] 8.2 Tests composant pour dispute-form
  - [ ] 8.3 Tests integration pour le flow complet

## Dev Notes

### Schema Prisma - Modele Dispute

```prisma
// Dans prisma/schema.prisma

enum DisputeType {
  NOT_RECEIVED
  DAMAGED
  NOT_AS_DESCRIBED
  OTHER
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED_REFUND
  RESOLVED_NO_REFUND
  CLOSED
}

model Dispute {
  id            String        @id @default(cuid())
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  type          DisputeType
  status        DisputeStatus @default(OPEN)
  description   String        @db.Text
  customerPhotos String[]     // URLs Cloudinary

  // Resolution
  resolution    String?       @db.Text
  resolvedBy    String?       // Admin userId
  resolvedAt    DateTime?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([orderId])
  @@index([status])
  @@map("disputes")
}
```

### Value Object DisputeType

```typescript
// src/modules/orders/domain/value-objects/dispute-type.vo.ts
import { ValueObject } from '@/shared/domain/value-object.base';

export enum DisputeType {
  NOT_RECEIVED = 'NOT_RECEIVED',
  DAMAGED = 'DAMAGED',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  OTHER = 'OTHER',
}

export const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  [DisputeType.NOT_RECEIVED]: 'Colis non recu',
  [DisputeType.DAMAGED]: 'Article endommage',
  [DisputeType.NOT_AS_DESCRIBED]: 'Article non conforme',
  [DisputeType.OTHER]: 'Autre probleme',
};
```

### Page Details Commande Client

```typescript
// src/app/(client)/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { DisputeForm } from '@/components/client/dispute-form';
import { OrderTimeline } from '@/components/client/order-timeline';
import { CountdownTimer } from '@/components/ui/countdown-timer';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      buyerId: session.user.id,
    },
    include: {
      items: { include: { product: true } },
      shippingAddress: true,
      creator: true,
      dispute: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Verifier si le client peut signaler un litige
  const canOpenDispute = order.status === 'DELIVERED' &&
    order.validationDeadline &&
    new Date() < order.validationDeadline &&
    !order.dispute;

  const timeRemaining = order.validationDeadline
    ? order.validationDeadline.getTime() - Date.now()
    : 0;

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Commande #{order.orderNumber}</h1>
        <span className="badge badge-lg">{order.status}</span>
      </div>

      {/* Timeline de la commande */}
      <OrderTimeline order={order} />

      {/* Informations de la commande */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Articles */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Articles</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatPrice(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2">
              <span>Total</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Adresse de livraison */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Adresse de livraison</h2>
            <p>
              {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
              <br />
              {order.shippingAddress?.address1}
              <br />
              {order.shippingAddress?.postalCode} {order.shippingAddress?.city}
            </p>
          </div>
        </div>
      </div>

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Suivi de livraison</h2>
            <p>Transporteur: {order.shippingCarrier}</p>
            <p>Numero de suivi: {order.trackingNumber}</p>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                Suivre mon colis
              </a>
            )}
          </div>
        </div>
      )}

      {/* Section Litige */}
      {canOpenDispute && (
        <div className="card bg-warning/10 shadow border border-warning">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-warning">Un probleme avec votre commande ?</h2>
              <CountdownTimer deadline={order.validationDeadline!} />
            </div>
            <p className="text-sm opacity-70">
              Vous avez jusqu'au {order.validationDeadline?.toLocaleDateString('fr-FR')} pour
              signaler un probleme. Passe ce delai, les fonds seront automatiquement liberes
              au createur.
            </p>
            <DisputeForm orderId={order.id} />
          </div>
        </div>
      )}

      {/* Litige existant */}
      {order.dispute && (
        <div className="card bg-error/10 shadow border border-error">
          <div className="card-body">
            <h2 className="card-title text-error">Litige en cours</h2>
            <p><strong>Type:</strong> {DISPUTE_TYPE_LABELS[order.dispute.type]}</p>
            <p><strong>Description:</strong> {order.dispute.description}</p>
            <p><strong>Statut:</strong> {order.dispute.status}</p>
          </div>
        </div>
      )}

      {/* Delai depasse */}
      {order.status === 'DELIVERED' && order.validationDeadline && new Date() > order.validationDeadline && !order.dispute && (
        <div className="alert alert-info">
          Le delai de signalement de 48h est depasse. Les fonds ont ete liberes au createur.
        </div>
      )}
    </div>
  );
}
```

### Composant Formulaire de Litige

```typescript
// src/components/client/dispute-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { openDispute } from '@/app/(client)/orders/[id]/actions';
import { ImageUpload } from '@/components/ui/image-upload';
import { DisputeType, DISPUTE_TYPE_LABELS } from '@/modules/orders/domain/value-objects/dispute-type.vo';

const disputeSchema = z.object({
  type: z.nativeEnum(DisputeType),
  description: z.string().min(20, 'Description trop courte (min 20 caracteres)'),
  photos: z.array(z.string()).max(5, 'Maximum 5 photos'),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

interface DisputeFormProps {
  orderId: string;
}

export function DisputeForm({ orderId }: DisputeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      photos: [],
    },
  });

  const onSubmit = async (data: DisputeFormData) => {
    setIsSubmitting(true);
    try {
      const result = await openDispute({
        orderId,
        type: data.type,
        description: data.description,
        photos,
      });

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      {/* Type de probleme */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Type de probleme *</span>
        </label>
        <select
          {...register('type')}
          className="select select-bordered w-full"
        >
          <option value="">Selectionnez un type</option>
          {Object.entries(DISPUTE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.type && (
          <span className="text-error text-sm">{errors.type.message}</span>
        )}
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Description du probleme *</span>
        </label>
        <textarea
          {...register('description')}
          className="textarea textarea-bordered h-32"
          placeholder="Decrivez le probleme rencontre en detail..."
        />
        {errors.description && (
          <span className="text-error text-sm">{errors.description.message}</span>
        )}
      </div>

      {/* Photos */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Photos (optionnel, max 5)</span>
        </label>
        <ImageUpload
          value={photos}
          onChange={setPhotos}
          maxImages={5}
          folder="disputes"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-warning w-full"
      >
        {isSubmitting ? (
          <span className="loading loading-spinner"></span>
        ) : (
          'Soumettre le signalement'
        )}
      </button>
    </form>
  );
}
```

### Server Action

```typescript
// src/app/(client)/orders/[id]/actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { container } from '@/lib/container';
import { OpenDisputeUseCase } from '@/modules/orders/application/use-cases/open-dispute.use-case';
import { DisputeType } from '@/modules/orders/domain/value-objects/dispute-type.vo';

interface OpenDisputeInput {
  orderId: string;
  type: DisputeType;
  description: string;
  photos: string[];
}

export async function openDispute(input: OpenDisputeInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: 'Non authentifie' };
  }

  const openDisputeUseCase = container.resolve(OpenDisputeUseCase);

  const result = await openDisputeUseCase.execute({
    orderId: input.orderId,
    customerId: session.user.id,
    type: input.type,
    description: input.description,
    photos: input.photos,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
```

### Use Case Open Dispute

```typescript
// src/modules/orders/application/use-cases/open-dispute.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { DisputeRepository } from '../ports/dispute.repository.port';
import { EmailPort } from '../ports/email.port';
import { NotificationPort } from '../ports/notification.port';
import { DisputeType } from '../../domain/value-objects/dispute-type.vo';
import { Dispute } from '../../domain/entities/dispute.entity';

export interface OpenDisputeInput {
  orderId: string;
  customerId: string;
  type: DisputeType;
  description: string;
  photos: string[];
}

export class OpenDisputeUseCase implements UseCase<OpenDisputeInput, void> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly disputeRepository: DisputeRepository,
    private readonly emailService: EmailPort,
    private readonly notificationService: NotificationPort
  ) {}

  async execute(input: OpenDisputeInput): Promise<Result<void>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    // 2. Verifier que le client est bien l'acheteur
    if (order.buyerId !== input.customerId) {
      return Result.fail('Non autorise');
    }

    // 3. Verifier l'eligibilite
    if (!order.canOpenDispute()) {
      return Result.fail('Le delai pour signaler un probleme est depasse');
    }

    // 4. Creer le litige
    const disputeResult = Dispute.create({
      orderId: order.id.value,
      type: input.type,
      description: input.description,
      photos: input.photos,
    });

    if (disputeResult.isFailure) {
      return Result.fail(disputeResult.error!);
    }

    // 5. Mettre a jour le statut de la commande
    const openResult = order.openDispute();
    if (openResult.isFailure) {
      return Result.fail(openResult.error!);
    }

    // 6. Persister
    await this.disputeRepository.save(disputeResult.value);
    await this.orderRepository.save(order);

    // 7. Notifications
    // Email au createur
    await this.emailService.sendDisputeOpenedEmail(order, disputeResult.value);

    // Email de confirmation au client
    await this.emailService.sendDisputeConfirmationEmail(order, disputeResult.value);

    // Notification in-app admin
    await this.notificationService.notifyAdmin({
      type: 'DISPUTE_OPENED',
      title: `Litige ouvert - Commande #${order.orderNumber}`,
      message: `Un client a signale un probleme: ${input.type}`,
      data: { orderId: order.id.value, disputeId: disputeResult.value.id.value },
    });

    return Result.ok();
  }
}
```

### Order Entity - Methode canOpenDispute

```typescript
// Dans src/modules/orders/domain/entities/order.entity.ts

canOpenDispute(): boolean {
  // Doit etre DELIVERED
  if (this.props.status.value !== OrderStatus.DELIVERED) {
    return false;
  }

  // La deadline ne doit pas etre depassee
  if (!this.props.validationDeadline) {
    return false;
  }

  return new Date() < this.props.validationDeadline;
}

openDispute(): Result<void> {
  if (!this.canOpenDispute()) {
    return Result.fail('Cannot open dispute on this order');
  }

  this.props.status = OrderStatusVO.create(OrderStatus.DISPUTE_OPENED);
  this.props.disputeOpenedAt = new Date();

  return Result.ok();
}
```

### References

- [Source: architecture.md#Order Status]
- [Source: prd.md#FR44]
- [Source: epics.md#Story 9.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story creee | Claude Opus 4.5 |
