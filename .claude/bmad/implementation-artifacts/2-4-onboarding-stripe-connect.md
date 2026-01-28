# Story 2.4: Onboarding Stripe Connect

Status: review

## Story

As a Client en cours d'upgrade,
I want configurer mon compte Stripe Connect,
so that je puisse recevoir les paiements de mes ventes.

## Acceptance Criteria

1. **AC1 - Bouton de configuration Stripe**
   - **Given** un Client ayant validé son SIRET (étape 2 complétée)
   - **When** il arrive à l'étape 3
   - **Then** un bouton "Configurer les paiements" est affiché avec explication

2. **AC2 - Création du compte Stripe Connect**
   - **Given** un Client qui clique sur "Configurer les paiements"
   - **When** le système traite la requête
   - **Then** un compte Stripe Connect Express est créé
   - **And** un stripeAccountId est généré et associé

3. **AC3 - Redirection vers Stripe Onboarding**
   - **Given** un compte Stripe créé
   - **When** l'utilisateur est redirigé
   - **Then** il arrive sur le flux Stripe Connect onboarding
   - **And** il peut saisir ses informations bancaires

4. **AC4 - Webhook confirmation onboarding**
   - **Given** l'utilisateur complète l'onboarding Stripe
   - **When** Stripe envoie le webhook account.updated
   - **Then** stripeOnboarded passe à true avec stripeOnboardedAt
   - **And** l'utilisateur est redirigé vers la confirmation

5. **AC5 - Abandon et reprise**
   - **Given** l'utilisateur abandonne l'onboarding Stripe
   - **When** il revient sur Kpsull
   - **Then** il peut reprendre l'onboarding Stripe depuis son profil

## Tasks / Subtasks

- [ ] **Task 1: Configurer Stripe Connect** (AC: #2)
  - [ ] 1.1 Installer le SDK Stripe `stripe`
  - [ ] 1.2 Créer `src/lib/stripe/client.ts` pour le client Stripe
  - [ ] 1.3 Configurer les variables STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - [ ] 1.4 Créer `src/modules/creators/infrastructure/services/stripe-connect.service.ts`

- [ ] **Task 2: Créer la page étape 3** (AC: #1)
  - [ ] 2.1 Créer `src/app/(auth)/onboarding/creator/step/3/page.tsx`
  - [ ] 2.2 Afficher les informations et le bouton de configuration
  - [ ] 2.3 Gérer les états : non configuré, en cours, configuré

- [ ] **Task 3: Implémenter le use case CreateStripeAccount** (AC: #2, #3)
  - [ ] 3.1 Créer `src/modules/creators/application/use-cases/create-stripe-account.use-case.ts`
  - [ ] 3.2 Appeler Stripe API pour créer le compte Express
  - [ ] 3.3 Générer l'Account Link pour l'onboarding
  - [ ] 3.4 Sauvegarder le stripeAccountId

- [ ] **Task 4: Implémenter le webhook handler** (AC: #4)
  - [ ] 4.1 Créer `src/app/api/webhooks/stripe/route.ts`
  - [ ] 4.2 Vérifier la signature du webhook
  - [ ] 4.3 Gérer l'événement `account.updated`
  - [ ] 4.4 Mettre à jour stripeOnboarded et stripeOnboardedAt

- [ ] **Task 5: Gérer la reprise d'onboarding** (AC: #5)
  - [ ] 5.1 Créer `src/modules/creators/application/use-cases/resume-stripe-onboarding.use-case.ts`
  - [ ] 5.2 Générer un nouveau Account Link si nécessaire
  - [ ] 5.3 Afficher l'option de reprise sur le profil

- [ ] **Task 6: Écrire les tests** (AC: #1-5)
  - [ ] 6.1 Tests unitaires pour StripeConnectService (mock Stripe)
  - [ ] 6.2 Tests unitaires pour les use cases
  - [ ] 6.3 Tests pour le webhook handler

## Dev Notes

### Configuration Stripe

```typescript
// src/lib/stripe/client.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});
```

### Service Stripe Connect

```typescript
// src/modules/creators/infrastructure/services/stripe-connect.service.ts
import { stripe } from "@/lib/stripe/client";
import { Result } from "@/shared/domain";

export interface CreateAccountResult {
  accountId: string;
  onboardingUrl: string;
}

export class StripeConnectService implements IStripeConnectService {
  async createConnectAccount(
    email: string,
    businessName: string
  ): Promise<Result<CreateAccountResult>> {
    try {
      // Créer le compte Express
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email,
        business_type: "individual",
        business_profile: {
          name: businessName,
          product_description: "Créateur sur Kpsull - Marketplace artisanale",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Créer le lien d'onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXTAUTH_URL}/onboarding/creator/step/3?refresh=true`,
        return_url: `${process.env.NEXTAUTH_URL}/onboarding/creator/step/3?success=true`,
        type: "account_onboarding",
      });

      return Result.ok({
        accountId: account.id,
        onboardingUrl: accountLink.url,
      });
    } catch (error) {
      console.error("Stripe Connect error:", error);
      return Result.fail("Erreur lors de la création du compte Stripe");
    }
  }

  async createAccountLink(accountId: string): Promise<Result<string>> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXTAUTH_URL}/onboarding/creator/step/3?refresh=true`,
        return_url: `${process.env.NEXTAUTH_URL}/onboarding/creator/step/3?success=true`,
        type: "account_onboarding",
      });

      return Result.ok(accountLink.url);
    } catch (error) {
      return Result.fail("Erreur lors de la génération du lien Stripe");
    }
  }

  async checkAccountStatus(accountId: string): Promise<Result<boolean>> {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      const isOnboarded =
        account.charges_enabled &&
        account.payouts_enabled &&
        account.details_submitted;

      return Result.ok(isOnboarded);
    } catch (error) {
      return Result.fail("Erreur lors de la vérification du compte Stripe");
    }
  }
}
```

### Webhook Handler

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed");
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
      // Update creator onboarding status
      await prisma.creator.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          stripeOnboarded: true,
          stripeOnboardedAt: new Date(),
        },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
```

### Variables d'Environnement

```bash
# .env.local
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

### Références

- [Source: architecture.md#Stripe Connect Integration]
- [Source: prd.md#FR6]
- [Source: epics.md#Story 2.4]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story créée | Claude Opus 4.5 |
