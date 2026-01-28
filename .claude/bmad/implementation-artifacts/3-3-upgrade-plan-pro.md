# Story 3.3: Upgrade vers Plan PRO

Status: ready-for-dev

## Story

As a Créateur FREE,
I want passer au plan PRO,
so that je puisse vendre sans limites et accéder aux fonctionnalités avancées.

## Acceptance Criteria

1. **AC1 - Page de comparaison des plans**
   - **Given** un Créateur FREE sur la page des plans
   - **When** il consulte les offres
   - **Then** il voit la comparaison FREE vs PRO avec prix et features

2. **AC2 - Redirection vers Stripe Checkout**
   - **Given** un Créateur FREE qui clique sur "Choisir PRO"
   - **When** il est redirigé
   - **Then** il arrive sur Stripe Checkout avec le prix PRO mensuel

3. **AC3 - Mise à jour après paiement réussi**
   - **Given** le paiement Stripe réussi
   - **When** le webhook checkout.session.completed est reçu
   - **Then** la Subscription passe en plan PRO
   - **And** productLimit et salesLimit passent à -1 (illimité)
   - **And** stripeSubscriptionId et stripeCustomerId sont enregistrés

4. **AC4 - Email de confirmation**
   - **Given** l'upgrade réussi
   - **When** le système traite la confirmation
   - **Then** un email de confirmation est envoyé

5. **AC5 - Gestion de l'échec de paiement**
   - **Given** le paiement échoue
   - **When** l'utilisateur revient sur Kpsull
   - **Then** il reste en plan FREE avec un message d'erreur

## Tasks / Subtasks

- [ ] **Task 1: Créer la page d'upgrade** (AC: #1)
  - [ ] 1.1 Créer `src/app/(dashboard)/subscription/upgrade/page.tsx`
  - [ ] 1.2 Créer le composant PricingTable avec FREE vs PRO
  - [ ] 1.3 Afficher les prix et features
  - [ ] 1.4 Bouton CTA pour chaque plan

- [ ] **Task 2: Implémenter Stripe Billing** (AC: #2)
  - [ ] 2.1 Créer le produit et prix PRO dans Stripe Dashboard
  - [ ] 2.2 Créer `src/modules/subscriptions/infrastructure/services/stripe-billing.service.ts`
  - [ ] 2.3 Implémenter `createCheckoutSession`
  - [ ] 2.4 Créer le Server Action pour initier le checkout

- [ ] **Task 3: Implémenter le webhook checkout** (AC: #3)
  - [ ] 3.1 Ajouter le handler `checkout.session.completed` dans `/api/webhooks/stripe`
  - [ ] 3.2 Récupérer les metadata (userId, plan)
  - [ ] 3.3 Mettre à jour la Subscription en base

- [ ] **Task 4: Créer le use case UpgradeToPro** (AC: #3)
  - [ ] 4.1 Créer `src/modules/subscriptions/application/use-cases/upgrade-to-pro.use-case.ts`
  - [ ] 4.2 Valider le paiement Stripe
  - [ ] 4.3 Mettre à jour plan, limites, IDs Stripe

- [ ] **Task 5: Implémenter l'email de confirmation** (AC: #4)
  - [ ] 5.1 Créer le template email "Bienvenue en PRO"
  - [ ] 5.2 Envoyer après upgrade réussi

- [ ] **Task 6: Gérer les pages de retour** (AC: #5)
  - [ ] 6.1 Créer `src/app/(dashboard)/subscription/success/page.tsx`
  - [ ] 6.2 Créer `src/app/(dashboard)/subscription/cancel/page.tsx`
  - [ ] 6.3 Afficher les messages appropriés

- [ ] **Task 7: Écrire les tests** (AC: #1-5)
  - [ ] 7.1 Tests unitaires pour StripeBillingService
  - [ ] 7.2 Tests unitaires pour UpgradeToProUseCase
  - [ ] 7.3 Tests pour le webhook handler

## Dev Notes

### Service Stripe Billing

```typescript
// src/modules/subscriptions/infrastructure/services/stripe-billing.service.ts
import { stripe } from "@/lib/stripe/client";
import { Result } from "@/shared/domain";

export class StripeBillingService implements IStripeBillingService {
  private readonly proPriceId = process.env.STRIPE_PRO_PRICE_ID!;

  async createCheckoutSession(
    customerId: string | null,
    email: string,
    userId: string,
    creatorId: string
  ): Promise<Result<string>> {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customerId || undefined,
        customer_email: customerId ? undefined : email,
        line_items: [
          {
            price: this.proPriceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/subscription/cancel`,
        metadata: {
          userId,
          creatorId,
          plan: "PRO",
        },
        subscription_data: {
          metadata: {
            userId,
            creatorId,
          },
        },
      });

      return Result.ok(session.url!);
    } catch (error) {
      console.error("Stripe Checkout error:", error);
      return Result.fail("Erreur lors de la création de la session de paiement");
    }
  }
}
```

### Webhook Handler pour Checkout

```typescript
// Dans src/app/api/webhooks/stripe/route.ts
if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode === "subscription" && session.metadata?.plan === "PRO") {
    const { userId, creatorId } = session.metadata;
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    // Récupérer les détails de l'abonnement
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Mettre à jour la subscription en base
    await prisma.subscription.update({
      where: { creatorId },
      data: {
        plan: "PRO",
        status: "ACTIVE",
        productLimit: -1,
        salesLimit: -1,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    // Envoyer email de confirmation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await resend.emails.send({
      to: user!.email,
      subject: "Bienvenue dans Kpsull PRO ! 🎉",
      react: ProWelcomeEmail({ name: user!.name }),
    });
  }
}
```

### Composant PricingTable

```typescript
// src/components/subscription/pricing-table.tsx
const plans = [
  {
    name: "FREE",
    price: "0€",
    period: "/mois",
    description: "Pour démarrer",
    features: [
      "5 produits maximum",
      "10 ventes maximum",
      "Dashboard de base",
      "Support email",
    ],
    limitations: [
      "Analytics avancés",
      "Export rapports",
      "Support prioritaire",
    ],
    cta: "Plan actuel",
    disabled: true,
  },
  {
    name: "PRO",
    price: "29€",
    period: "/mois",
    description: "Pour les créateurs sérieux",
    features: [
      "Produits illimités",
      "Ventes illimitées",
      "Analytics avancés",
      "Export des rapports",
      "Support prioritaire",
      "Domaine personnalisé",
    ],
    limitations: [],
    cta: "Passer à PRO",
    disabled: false,
    highlighted: true,
  },
];
```

### Variables d'Environnement

```bash
# .env.local
STRIPE_PRO_PRICE_ID="price_xxxxx" # ID du prix mensuel PRO dans Stripe
```

### Références

- [Source: architecture.md#Stripe Billing Integration]
- [Source: prd.md#FR10, FR12]
- [Source: epics.md#Story 3.3]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
