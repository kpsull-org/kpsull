# Story 3.5: Administration des Abonnements (Admin)

Status: ready-for-dev

## Story

As a Admin,
I want gérer les abonnements des créateurs,
so that je puisse résoudre les problèmes et faire des gestes commerciaux.

## Acceptance Criteria

1. **AC1 - Liste des abonnements**
   - **Given** un Admin sur la page de gestion des abonnements
   - **When** il consulte la liste
   - **Then** il voit tous les créateurs avec : nom, plan, statut, date renouvellement

2. **AC2 - Filtres et recherche**
   - **Given** un Admin sur la liste
   - **When** il utilise les filtres
   - **Then** il peut filtrer par plan (FREE/PRO), statut, période

3. **AC3 - Détails d'un abonnement**
   - **Given** un Admin qui consulte un abonnement spécifique
   - **When** il clique sur "Voir détails"
   - **Then** il voit l'historique complet et les options de modification

4. **AC4 - Prolongation de période**
   - **Given** un Admin qui prolonge un abonnement
   - **When** il valide la modification
   - **Then** currentPeriodEnd est mis à jour
   - **And** un log d'audit est créé
   - **And** le créateur reçoit un email de notification

5. **AC5 - Suspension et réactivation**
   - **Given** un Admin qui suspend un abonnement
   - **When** il valide l'action
   - **Then** le statut passe à PAUSED
   - **And** le créateur est notifié

## Tasks / Subtasks

- [ ] **Task 1: Créer la page admin des abonnements** (AC: #1, #2)
  - [ ] 1.1 Créer `src/app/(admin)/admin/subscriptions/page.tsx`
  - [ ] 1.2 Implémenter la table avec DataTable (shadcn)
  - [ ] 1.3 Ajouter les filtres par plan et statut
  - [ ] 1.4 Implémenter la recherche par nom/email

- [ ] **Task 2: Créer la page de détail abonnement** (AC: #3)
  - [ ] 2.1 Créer `src/app/(admin)/admin/subscriptions/[id]/page.tsx`
  - [ ] 2.2 Afficher les informations complètes
  - [ ] 2.3 Afficher l'historique des modifications
  - [ ] 2.4 Afficher les actions disponibles

- [ ] **Task 3: Implémenter les actions admin** (AC: #4, #5)
  - [ ] 3.1 Créer `ExtendSubscriptionUseCase`
  - [ ] 3.2 Créer `SuspendSubscriptionUseCase`
  - [ ] 3.3 Créer `ReactivateSubscriptionUseCase`
  - [ ] 3.4 Créer `ChangePlanUseCase`

- [ ] **Task 4: Implémenter les logs d'audit** (AC: #4)
  - [ ] 4.1 Créer le modèle AuditLog dans Prisma
  - [ ] 4.2 Logger chaque action admin
  - [ ] 4.3 Afficher l'historique dans les détails

- [ ] **Task 5: Implémenter les notifications** (AC: #4, #5)
  - [ ] 5.1 Créer les templates email pour chaque action
  - [ ] 5.2 Envoyer les notifications aux créateurs concernés

- [ ] **Task 6: Écrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour les use cases admin
  - [ ] 6.2 Tests pour les logs d'audit
  - [ ] 6.3 Tests de permissions admin

## Dev Notes

### Structure Page Admin

```typescript
// src/app/(admin)/admin/subscriptions/page.tsx
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { SubscriptionsDataTable } from "./data-table";

export default async function AdminSubscriptionsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const subscriptions = await getSubscriptionsWithCreators();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des abonnements</h1>
      <SubscriptionsDataTable data={subscriptions} />
    </div>
  );
}
```

### DataTable avec Filtres

```typescript
// src/app/(admin)/admin/subscriptions/columns.tsx
export const columns: ColumnDef<SubscriptionWithCreator>[] = [
  {
    accessorKey: "creator.brandName",
    header: "Créateur",
  },
  {
    accessorKey: "plan",
    header: "Plan",
    cell: ({ row }) => (
      <Badge variant={row.original.plan === "PRO" ? "default" : "secondary"}>
        {row.original.plan}
      </Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = {
        ACTIVE: "success",
        PAST_DUE: "warning",
        CANCELED: "destructive",
        PAUSED: "secondary",
      }[status];
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "currentPeriodEnd",
    header: "Renouvellement",
    cell: ({ row }) => format(row.original.currentPeriodEnd, "dd/MM/yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => <SubscriptionActions subscription={row.original} />,
  },
];
```

### Use Case ExtendSubscription

```typescript
// src/modules/subscriptions/application/use-cases/extend-subscription.use-case.ts
export class ExtendSubscriptionUseCase {
  async execute(dto: ExtendSubscriptionDTO): Promise<Result<void>> {
    const { subscriptionId, days, adminId, reason } = dto;

    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      return Result.fail("Abonnement non trouvé");
    }

    const newEndDate = addDays(subscription.currentPeriodEnd, days);

    await this.subscriptionRepo.update(subscriptionId, {
      currentPeriodEnd: newEndDate,
    });

    // Log d'audit
    await this.auditRepo.create({
      action: "SUBSCRIPTION_EXTENDED",
      entityType: "Subscription",
      entityId: subscriptionId,
      adminId,
      changes: {
        previousEndDate: subscription.currentPeriodEnd,
        newEndDate,
        daysAdded: days,
      },
      reason,
    });

    // Notifier le créateur
    const creator = await this.creatorRepo.findById(subscription.creatorId);
    await this.emailService.sendSubscriptionExtended({
      email: creator.user.email,
      name: creator.user.name,
      newEndDate,
      reason,
    });

    return Result.ok();
  }
}
```

### Modèle AuditLog

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  action      String
  entityType  String
  entityId    String
  adminId     String
  admin       User     @relation(fields: [adminId], references: [id])
  changes     Json
  reason      String?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([adminId])
  @@map("audit_logs")
}
```

### Références

- [Source: architecture.md#Admin Module]
- [Source: prd.md#FR13, FR14]
- [Source: epics.md#Story 3.5]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
