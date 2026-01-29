# PRD: Corrections Securite & Qualite - Kpsull

**Version:** 1.0
**Date:** 2026-01-29
**Auteur:** Claude Code Review
**Priorite:** CRITIQUE

---

## 1. Resume Executif

Suite a la code review complete du projet Kpsull (52 stories, 12 epics), **59 problemes** ont ete identifies dont **15 critiques** necessitant une correction immediate avant mise en production.

Ce PRD definit les corrections a apporter pour securiser l'application et garantir sa fiabilite.

---

## 2. Probleme & Contexte

### 2.1 Situation Actuelle

Le projet Kpsull est une marketplace SaaS pour createurs francais. L'implementation des 52 stories est complete avec:
- 1279 tests passants
- Architecture hexagonale respectee
- CI TypeScript/ESLint operationnelle

### 2.2 Problemes Identifies

| Categorie | Critique | Majeur | Mineur | Total |
|-----------|----------|--------|--------|-------|
| Securite | 6 | 4 | 2 | 12 |
| Race Conditions | 4 | 5 | 0 | 9 |
| Validation | 3 | 6 | 4 | 13 |
| Architecture | 1 | 4 | 3 | 8 |
| Performance | 1 | 5 | 1 | 7 |
| Tests | 0 | 0 | 10 | 10 |
| **Total** | **15** | **24** | **20** | **59** |

### 2.3 Risques Sans Correction

1. **XSS** - Injection de code malveillant via CustomSection
2. **Donnees PCI** - Informations de carte bancaire exposees
3. **Race conditions** - Depassement de limites, doublons utilisateurs
4. **Upload malveillant** - Fichiers executables deguises en images
5. **Escalade de privileges** - Cast de role sans validation

---

## 3. Objectifs

### 3.1 Objectifs Mesurables

| Objectif | Metrique | Cible |
|----------|----------|-------|
| Issues critiques | Nombre | 0 |
| Issues majeures | Nombre | < 5 |
| Couverture tests | % | > 80% sur nouveau code |
| CI | Status | Passante |

### 3.2 Criteres de Succes

- [ ] Toutes les 15 issues CRITIQUES corrigees
- [ ] Tests de non-regression pour chaque correction
- [ ] Audit de securite automatise (npm audit, snyk)
- [ ] Documentation des corrections

---

## 4. Scope

### 4.1 Dans le Scope (Must Have)

#### Epic FIX-1: Securite XSS & Injection
- **FIX-1.1**: Sanitization HTML avec DOMPurify dans CustomSection
- **FIX-1.2**: Validation JSON.parse sessionStorage avec Zod
- **FIX-1.3**: Suppression formulaire carte custom (utiliser Stripe Elements)

#### Epic FIX-2: Validation Uploads
- **FIX-2.1**: Validation type MIME (magic bytes)
- **FIX-2.2**: Limite taille fichier (10MB max)
- **FIX-2.3**: Whitelist extensions autorisees

#### Epic FIX-3: Race Conditions
- **FIX-3.1**: Transactions atomiques pour CreateUser
- **FIX-3.2**: Upsert Prisma pour repositories
- **FIX-3.3**: Lock optimiste pour Order save
- **FIX-3.4**: Hydratation Zustand avec onFinishHydration

#### Epic FIX-4: Validation & Authorization
- **FIX-4.1**: Validation Role enum avant cast
- **FIX-4.2**: Verification admin dans ExtendSubscription
- **FIX-4.3**: Verification ownership dans ReorderImages
- **FIX-4.4**: Validation pagination (limit max 100)

#### Epic FIX-5: Persistence & Data
- **FIX-5.1**: Persister stripeCustomerId et gracePeriodStart
- **FIX-5.2**: Verification Result.isSuccess avant .value!
- **FIX-5.3**: Validation inputs non-vides systematique

### 4.2 Hors Scope (Nice to Have)

- Refactoring complet des tests existants
- Migration vers Stripe Elements (garde formulaire simule pour demo)
- Optimisation images thumbnails
- Rate limiting global (a traiter separement)

---

## 5. User Stories de Correction

### Epic FIX-1: Securite XSS & Injection

#### FIX-1.1: Sanitization HTML CustomSection
**En tant que** visiteur de page createur
**Je veux** que le contenu HTML soit securise
**Afin de** ne pas etre victime d'attaques XSS

**Acceptance Criteria:**
- [ ] DOMPurify installe et configure
- [ ] Tout HTML passe par DOMPurify.sanitize()
- [ ] Test: injection `<script>alert(1)</script>` neutralisee
- [ ] Test: balises autorisees preservees (p, h1, ul, etc.)

**Fichiers:**
- `src/components/page-render/sections/custom-section.tsx`

---

#### FIX-1.2: Validation SessionStorage
**En tant que** utilisateur du checkout
**Je veux** que mes donnees soient validees
**Afin de** ne pas avoir de comportements inattendus

**Acceptance Criteria:**
- [ ] Schema Zod pour ShippingAddress
- [ ] Schema Zod pour GuestCheckout
- [ ] Schema Zod pour OrderConfirmation
- [ ] Redirect vers etape precedente si validation echoue
- [ ] Tests unitaires pour chaque schema

**Fichiers:**
- `src/app/(checkout)/checkout/payment/page.tsx`
- `src/app/(checkout)/checkout/confirmation/page.tsx`
- `src/lib/schemas/checkout.schema.ts` (nouveau)

---

#### FIX-1.3: Suppression Formulaire Carte
**En tant que** developpeur
**Je veux** ne pas manipuler de donnees PCI
**Afin de** respecter la compliance PCI-DSS

**Acceptance Criteria:**
- [ ] State cardNumber/expiry/cvc supprime
- [ ] Commentaire expliquant l'integration Stripe Elements future
- [ ] UI placeholder "Integration Stripe Elements a venir"
- [ ] Formulaire de demo ne stocke plus de vraies donnees

**Fichiers:**
- `src/app/(checkout)/checkout/payment/page.tsx`

---

### Epic FIX-2: Validation Uploads

#### FIX-2.1: Validation MIME Type
**En tant que** createur
**Je veux** que seules les vraies images soient acceptees
**Afin de** proteger ma boutique des fichiers malveillants

**Acceptance Criteria:**
- [ ] Package `file-type` installe
- [ ] Verification magic bytes du fichier
- [ ] Whitelist: image/jpeg, image/png, image/webp, image/gif
- [ ] Test: fichier .exe renomme en .jpg rejete
- [ ] Message d'erreur explicite

**Fichiers:**
- `src/modules/products/application/use-cases/images/upload-product-image.use-case.ts`
- `src/lib/utils/file-validation.ts` (nouveau)

---

### Epic FIX-3: Race Conditions

#### FIX-3.1: Transaction CreateUser
**En tant que** systeme
**Je veux** que la creation d'utilisateur soit atomique
**Afin d'** eviter les doublons d'email

**Acceptance Criteria:**
- [ ] Utiliser try-catch sur contrainte unique Prisma
- [ ] Supprimer le check existsByEmail prealable
- [ ] Retourner erreur explicite si email existe
- [ ] Test de concurrence (2 requetes simultanees)

**Fichiers:**
- `src/modules/auth/application/use-cases/create-user.use-case.ts`

---

#### FIX-3.2: Upsert Repositories
**En tant que** systeme
**Je veux** des saves atomiques
**Afin d'** eviter les race conditions

**Acceptance Criteria:**
- [ ] Remplacer findUnique + create/update par upsert
- [ ] CreatorOnboardingRepository: upsert
- [ ] SubscriptionRepository: upsert
- [ ] Tests d'integration

**Fichiers:**
- `src/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository.ts`
- `src/modules/subscriptions/infrastructure/repositories/prisma-subscription.repository.ts`

---

#### FIX-3.3: Lock Optimiste Orders
**En tant que** createur
**Je veux** que mes commandes ne soient pas corrompues
**Afin de** garantir l'integrite des donnees

**Acceptance Criteria:**
- [ ] Ajouter champ `version` ou utiliser `updatedAt` comme lock
- [ ] Verifier version avant save
- [ ] Retourner erreur si modification concurrente
- [ ] Test: 2 updates simultanees -> 1 succes, 1 echec

**Fichiers:**
- `src/modules/orders/infrastructure/repositories/prisma-order.repository.ts`

---

#### FIX-3.4: Hydratation Zustand
**En tant que** utilisateur
**Je veux** que mon panier charge correctement
**Afin de** ne pas voir de flash de contenu vide

**Acceptance Criteria:**
- [ ] Utiliser onFinishHydration callback
- [ ] State `isHydrated` avant rendu
- [ ] Skeleton loader pendant hydratation
- [ ] Test: pas de redirect premature si panier en cours de chargement

**Fichiers:**
- `src/app/(checkout)/cart/page.tsx`
- `src/app/(checkout)/checkout/shipping/page.tsx`
- `src/app/(checkout)/checkout/payment/page.tsx`

---

### Epic FIX-4: Validation & Authorization

#### FIX-4.1: Validation Role Enum
**En tant que** systeme
**Je veux** valider les roles avant cast
**Afin d'** empecher l'escalade de privileges

**Acceptance Criteria:**
- [ ] Verification Object.values(Role).includes()
- [ ] Throw error si role invalide
- [ ] Test: role "SUPERADMIN" rejete

**Fichiers:**
- `src/modules/creators/infrastructure/repositories/prisma-user-role.repository.ts`

---

#### FIX-4.2: Verification Admin ExtendSubscription
**En tant que** admin
**Je veux** que seuls les admins puissent etendre les abonnements
**Afin de** securiser cette operation privilegiee

**Acceptance Criteria:**
- [ ] Injecter AuthorizationService
- [ ] Verifier isAdmin(adminId)
- [ ] Retourner erreur 403 si non admin
- [ ] Test: userId normal rejete

**Fichiers:**
- `src/modules/subscriptions/application/use-cases/extend-subscription.use-case.ts`

---

## 6. Specifications Techniques

### 6.1 Dependencies a Ajouter

```bash
bun add dompurify @types/dompurify  # Sanitization HTML
bun add file-type                    # Validation MIME
bun add zod                          # Deja present, schemas checkout
```

### 6.2 Schemas Zod a Creer

```typescript
// src/lib/schemas/checkout.schema.ts
import { z } from 'zod';

export const ShippingAddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  street: z.string().min(1).max(200),
  streetComplement: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{5}$/),
  country: z.string().min(1).max(100),
  phone: z.string().optional(),
});

export const GuestCheckoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const OrderConfirmationSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number().int().min(0),
    quantity: z.number().int().min(1),
    image: z.string().url().optional(),
  })),
  total: z.number().int().min(0),
  shippingAddress: ShippingAddressSchema,
  paidAt: z.string().datetime(),
});
```

### 6.3 Pattern Lock Optimiste

```typescript
// Dans prisma-order.repository.ts
async save(order: Order): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: order.idString },
      select: { updatedAt: true },
    });

    if (existing && existing.updatedAt.getTime() !== order.updatedAt.getTime()) {
      throw new ConcurrentModificationError(
        `Order ${order.idString} was modified by another process`
      );
    }

    await tx.order.upsert({
      where: { id: order.idString },
      create: { /* ... */ },
      update: { /* ... */ },
    });
  });
}
```

---

## 7. Plan de Test

### 7.1 Tests Unitaires Requis

| Story | Test | Fichier |
|-------|------|---------|
| FIX-1.1 | XSS sanitization | `custom-section.test.tsx` |
| FIX-1.2 | Schema validation | `checkout.schema.test.ts` |
| FIX-2.1 | MIME validation | `file-validation.test.ts` |
| FIX-3.1 | Concurrent create | `create-user.use-case.test.ts` |
| FIX-3.3 | Optimistic lock | `prisma-order.repository.test.ts` |
| FIX-4.1 | Role validation | `prisma-user-role.repository.test.ts` |

### 7.2 Tests d'Integration

- [ ] Checkout flow complet avec validation
- [ ] Upload image avec fichier malveillant
- [ ] Creation utilisateur concurrente (stress test)
- [ ] Modification commande concurrente

---

## 8. Estimation & Planning

### 8.1 Effort par Epic

| Epic | Stories | Effort (h) | Priorite |
|------|---------|------------|----------|
| FIX-1 | 3 | 4h | P0 |
| FIX-2 | 1 | 2h | P0 |
| FIX-3 | 4 | 6h | P0 |
| FIX-4 | 2 | 3h | P1 |
| FIX-5 | 3 | 2h | P1 |
| **Total** | **13** | **17h** | - |

### 8.2 Ordre d'Execution

1. **Sprint 1 (P0)**: FIX-1, FIX-2, FIX-3 (12h)
2. **Sprint 2 (P1)**: FIX-4, FIX-5 (5h)

---

## 9. Risques & Mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Regression | Moyenne | Haut | Tests exhaustifs avant/apres |
| Breaking changes API | Faible | Moyen | Pas de changement d'interface publique |
| Performance | Faible | Faible | Transactions limitees au necessaire |

---

## 10. Definition of Done

- [ ] Code corrige et commite
- [ ] Tests unitaires passants
- [ ] Tests d'integration passants
- [ ] CI verte (typecheck, lint, test)
- [ ] Code review approuvee
- [ ] Documentation mise a jour si necessaire
- [ ] Issue trackers fermees

---

## Annexes

### A. Liste Complete des Issues

Voir fichier `code-review-full-report.md` pour le detail de chaque issue.

### B. References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
