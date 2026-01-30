# Story 3.4: Gestion du Paiement Récurrent

Status: ready-for-dev

## Story

As a Créateur PRO,
I want que mon abonnement soit renouvelé automatiquement,
so that je n'aie pas d'interruption de service.

## Acceptance Criteria

1. **AC1 - Renouvellement automatique réussi**
   - **Given** un Créateur PRO avec abonnement actif
   - **When** la date de renouvellement approche
   - **Then** Stripe prélève automatiquement le montant
   - **And** currentPeriodStart et currentPeriodEnd sont mis à jour

2. **AC2 - Gestion de l'échec de paiement**
   - **Given** un échec de paiement récurrent
   - **When** le webhook invoice.payment_failed est reçu
   - **Then** la Subscription passe en statut PAST_DUE
   - **And** un email d'alerte est envoyé au créateur

3. **AC3 - Grace period de 7 jours**
   - **Given** une Subscription en PAST_DUE
   - **When** la grace period de 7 jours commence
   - **Then** le créateur peut toujours utiliser son compte PRO
   - **And** un rappel email est envoyé à J+3

4. **AC4 - Downgrade après grace period**
   - **Given** la grace period expirée sans paiement
   - **When** le système vérifie
   - **Then** la Subscription passe en CANCELED
   - **And** les limites FREE sont réappliquées (5 produits, 10 ventes)

## Tasks / Subtasks

- [ ] **Task 1: Gérer les webhooks de paiement récurrent** (AC: #1, #2)
  - [ ] 1.1 Ajouter handler `invoice.paid` pour renouvellement réussi
  - [ ] 1.2 Ajouter handler `invoice.payment_failed` pour échec
  - [ ] 1.3 Mettre à jour les dates de période

- [ ] **Task 2: Implémenter le statut PAST_DUE** (AC: #2, #3)
  - [ ] 2.1 Créer le use case `HandlePaymentFailed`
  - [ ] 2.2 Mettre à jour le statut Subscription
  - [ ] 2.3 Enregistrer la date de début de grace period

- [ ] **Task 3: Implémenter les emails d'alerte** (AC: #2, #3)
  - [ ] 3.1 Créer le template "Échec de paiement"
  - [ ] 3.2 Créer le template "Rappel grace period"
  - [ ] 3.3 Configurer les envois

- [ ] **Task 4: Créer le job de vérification grace period** (AC: #4)
  - [ ] 4.1 Créer `src/jobs/check-grace-period.ts`
  - [ ] 4.2 Vérifier quotidiennement les subscriptions PAST_DUE
  - [ ] 4.3 Downgrade celles > 7 jours

- [ ] **Task 5: Implémenter le downgrade** (AC: #4)
  - [ ] 5.1 Créer le use case `DowngradeToFree`
  - [ ] 5.2 Réappliquer les limites FREE
  - [ ] 5.3 Notifier le créateur du downgrade

- [ ] **Task 6: Écrire les tests** (AC: #1-4)
  - [ ] 6.1 Tests pour les webhooks
  - [ ] 6.2 Tests pour le job grace period
  - [ ] 6.3 Tests pour le downgrade

## Dev Notes

### Webhooks Stripe Billing

```typescript
// Dans src/app/api/webhooks/stripe/route.ts

// Renouvellement réussi
if (event.type === "invoice.paid") {
  const invoice = event.data.object as Stripe.Invoice;

  if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }
}

// Échec de paiement
if (event.type === "invoice.payment_failed") {
  const invoice = event.data.object as Stripe.Invoice;

  if (invoice.subscription) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { creator: { include: { user: true } } },
    });

    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "PAST_DUE",
          gracePeriodStart: new Date(),
        },
      });

      // Envoyer email d'alerte
      await resend.emails.send({
        to: sub.creator.user.email,
        subject: "⚠️ Échec de paiement - Action requise",
        react: PaymentFailedEmail({
          name: sub.creator.user.name,
          amount: invoice.amount_due / 100,
        }),
      });
    }
  }
}
```

### Job de Vérification Grace Period

```typescript
// src/jobs/check-grace-period.ts
import { prisma } from "@/lib/prisma/client";
import { resend } from "@/lib/resend/client";

const GRACE_PERIOD_DAYS = 7;
const REMINDER_DAY = 3;

export async function checkGracePeriod() {
  const now = new Date();

  // Récupérer les subscriptions en PAST_DUE
  const pastDueSubscriptions = await prisma.subscription.findMany({
    where: { status: "PAST_DUE" },
    include: { creator: { include: { user: true } } },
  });

  for (const sub of pastDueSubscriptions) {
    if (!sub.gracePeriodStart) continue;

    const daysSinceGracePeriod = Math.floor(
      (now.getTime() - sub.gracePeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Envoyer rappel à J+3
    if (daysSinceGracePeriod === REMINDER_DAY) {
      await resend.emails.send({
        to: sub.creator.user.email,
        subject: "Rappel : Mettez à jour votre moyen de paiement",
        react: GracePeriodReminderEmail({
          name: sub.creator.user.name,
          daysRemaining: GRACE_PERIOD_DAYS - REMINDER_DAY,
        }),
      });
    }

    // Downgrade après 7 jours
    if (daysSinceGracePeriod >= GRACE_PERIOD_DAYS) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "CANCELED",
          plan: "FREE",
          productLimit: 5,
          salesLimit: 10,
          stripeSubscriptionId: null,
          gracePeriodStart: null,
        },
      });

      // Annuler l'abonnement Stripe
      if (sub.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      }

      // Notifier le créateur
      await resend.emails.send({
        to: sub.creator.user.email,
        subject: "Votre abonnement PRO a été annulé",
        react: SubscriptionCanceledEmail({ name: sub.creator.user.name }),
      });
    }
  }
}
```

### Configuration Cron Job

```typescript
// src/app/api/cron/check-grace-period/route.ts
import { checkGracePeriod } from "@/jobs/check-grace-period";

export const runtime = "edge";

export async function GET(request: Request) {
  // Vérifier le secret pour sécuriser l'endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await checkGracePeriod();

  return new Response("OK", { status: 200 });
}

// Configurer dans vercel.json ou cron service externe
// Exécuter quotidiennement à 2h du matin
```

### Références

- [Source: architecture.md#Stripe Billing Webhooks]
- [Source: prd.md#FR12]
- [Source: epics.md#Story 3.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
