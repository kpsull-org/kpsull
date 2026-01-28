---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-decisions
  - step-04-data-model
  - step-05-integrations
  - step-06-testing
inputDocuments:
  - .claude/bmad/planning-artifacts/prd.md
workflowType: 'architecture'
project_name: 'Kpsull'
user_name: 'Eliott'
date: '2026-01-28'
---

# Architecture Decision Document - Kpsull

## Executive Summary

Ce document définit l'architecture complète de **Kpsull**, une plateforme SaaS marketplace freemium pour créateurs français. L'architecture suit les principes **Hexagonaux (Ports & Adapters)** avec une migration vers un monolithe **Next.js 15 full-stack**.

**Objectifs clés :**
- Isolation métier via architecture hexagonale
- Testabilité maximale (TDD)
- Scalabilité horizontale
- Multi-tenancy row-level security

---

## ADR-001: Migration NestJS vers Next.js Full-Stack

### Contexte

Le projet actuel possède une monorepo Turborepo avec :
- `apps/backend` : NestJS 10 (scaffold minimal avec Prisma)
- `apps/frontend` : Next.js 15 (bootstrapped)

### Décision

**Migrer vers une application Next.js 15 full-stack unique** utilisant App Router, API Routes et Server Actions.

### Justification

| Critère | NestJS séparé | Next.js full-stack |
|---------|---------------|-------------------|
| Complexité déploiement | 2 services | 1 service |
| Coût hébergement | Double | Simple |
| Partage types | Manuel | Automatique |
| DX | 2 contextes | Unifié |
| Performance | API calls | Server Components |

### Conséquences

- Supprimer `apps/backend` après migration
- Implémenter architecture hexagonale dans `apps/web/src/`
- Utiliser Route Handlers pour REST API
- Utiliser Server Actions pour mutations formulaires

---

## ADR-002: Architecture Hexagonale (Ports & Adapters)

### Contexte

Le PRD spécifie 60+ functional requirements avec logique métier complexe (escrow, subscriptions, multi-tenancy).

### Décision

Implémenter une **Architecture Hexagonale** avec séparation stricte des couches.

### Structure

```
src/modules/{module}/
├── domain/                 # Coeur métier (0 dépendance externe)
│   ├── entities/           # Entités et Aggregates
│   ├── value-objects/      # Value Objects immutables
│   ├── events/             # Domain Events
│   └── errors/             # Erreurs métier
│
├── application/            # Orchestration (dépend uniquement du domain)
│   ├── use-cases/          # Cas d'utilisation
│   ├── ports/              # Interfaces (contrats)
│   └── dtos/               # Data Transfer Objects
│
└── infrastructure/         # Implémentation technique
    ├── repositories/       # Adapters Prisma
    ├── services/           # Adapters services externes
    └── mappers/            # Transformation domain ↔ persistence
```

### Responsabilités des Couches

| Couche | Responsabilité | Dépendances |
|--------|----------------|-------------|
| **Domain** | Règles métier, invariants, événements | Aucune (TypeScript pur) |
| **Application** | Orchestration use cases, définition ports | Domain uniquement |
| **Infrastructure** | Implémentation adapters, persistence | Application + Domain |
| **App (UI)** | Routes, pages, composants | Toutes couches |

### Flux de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                             │
│  (Next.js App Router: pages, API routes, Server Actions)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATION                              │
│  (Use Cases orchestrent la logique via Ports)                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Use Case   │────▶│    Port     │◀────│   Adapter   │       │
│  │  (input)    │     │ (interface) │     │(infrastructure)│    │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DOMAIN                                  │
│  (Entités, Value Objects, Domain Events - logique pure)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ADR-003: Stack Technique

### Décision

| Composant | Technologie | Version | Justification |
|-----------|-------------|---------|---------------|
| **Framework** | Next.js | 15.x | App Router, RSC, Server Actions |
| **UI Library** | React | 19.x | Concurrent features, RSC support |
| **Styling** | TailwindCSS | 4.x | Utility-first, performant |
| **Components** | shadcn/ui | latest | Composants accessibles, customisables |
| **ORM** | Prisma | 6.x | Type-safe, migrations, excellent DX |
| **Database** | PostgreSQL | 15+ | ACID, row-level security, JSON |
| **Auth** | Auth.js | 5.x | OAuth, JWT, Prisma adapter |
| **Payments** | Stripe | Connect + Billing | Escrow, commissions, subscriptions |
| **Emails** | Resend | latest | API moderne, React Email |
| **CDN Images** | Cloudinary | latest | Optimisation auto, transformations |
| **Tracking** | AfterShip | latest | Multi-transporteurs, webhooks |
| **Tests Unit** | Vitest | latest | Fast, ESM native, compatible Jest |
| **Tests E2E** | Playwright | latest | Cross-browser, reliable |
| **Runtime** | Node.js | 20+ | LTS, performance |

---

## ADR-004: Authentification et Autorisation

### Décision

Utiliser **Auth.js (NextAuth v5)** avec :
- Google OAuth provider
- JWT session strategy
- Prisma adapter pour persistence
- Middleware RBAC custom

### Implémentation

```typescript
// lib/auth/auth.config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma/client";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.creatorId = user.creator?.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.creatorId = token.creatorId as string | undefined;
      return session;
    },
  },
};
```

### Rôles et Permissions (RBAC)

| Permission | CLIENT | CREATOR (FREE) | CREATOR (PRO) | ADMIN |
|------------|--------|----------------|---------------|-------|
| Parcourir pages | ✅ | ✅ | ✅ | ✅ |
| Acheter produits | ✅ | ✅ | ✅ | ✅ |
| Créer produits | ❌ | ✅ (5 max) | ✅ ∞ | ✅ |
| Page Builder | ❌ | ✅ (basic) | ✅ (premium) | ✅ |
| Dashboard stats | ❌ | ✅ | ✅ | ✅ |
| Analytics avancés | ❌ | ❌ | ✅ | ✅ |
| Export rapports | ❌ | ❌ | ✅ | ✅ |
| Dashboard plateforme | ❌ | ❌ | ❌ | ✅ |
| Gestion créateurs | ❌ | ❌ | ❌ | ✅ |

---

## ADR-005: Multi-Tenancy

### Décision

**Row-Level Security (RLS)** avec `creatorId` foreign key sur toutes les tables tenant-scoped.

### Implémentation

```typescript
// lib/prisma/tenant-middleware.ts
const TENANT_SCOPED_MODELS = [
  'Product', 'Project', 'Order', 'Customer',
  'CreatorPage', 'PageSection'
];

export function createTenantMiddleware(creatorId: string) {
  return async (params: any, next: any) => {
    if (TENANT_SCOPED_MODELS.includes(params.model)) {
      // Filtrage automatique sur les queries
      if (['findMany', 'findFirst', 'count'].includes(params.action)) {
        params.args = params.args || {};
        params.args.where = { ...params.args.where, creatorId };
      }

      // Injection automatique sur les créations
      if (params.action === 'create') {
        params.args.data = { ...params.args.data, creatorId };
      }
    }
    return next(params);
  };
}
```

---

## Structure de Dossiers Complète

```
apps/web/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (public)/                  # Routes publiques
│   │   │   ├── [slug]/                # Pages créateurs
│   │   │   │   ├── page.tsx
│   │   │   │   └── products/
│   │   │   │       └── [productId]/
│   │   │   │           └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/                    # Routes auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/               # Dashboard créateur
│   │   │   ├── page.tsx               # Home dashboard
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── customers/
│   │   │   │   └── page.tsx
│   │   │   ├── page-builder/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                   # Admin backoffice
│   │   │   ├── page.tsx
│   │   │   ├── creators/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── subscriptions/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (checkout)/                # Flow checkout
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   └── success/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                       # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── products/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── ship/
│   │   │   │           └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   │   └── route.ts
│   │   │   │   └── aftership/
│   │   │   │       └── route.ts
│   │   │   └── admin/
│   │   │       └── [...]/
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── modules/                       # ARCHITECTURE HEXAGONALE
│   │   │
│   │   ├── auth/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── session.entity.ts
│   │   │   │   └── value-objects/
│   │   │   │       └── role.vo.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── login.use-case.ts
│   │   │   │   │   └── logout.use-case.ts
│   │   │   │   └── ports/
│   │   │   │       └── auth.service.port.ts
│   │   │   └── infrastructure/
│   │   │       └── nextauth.adapter.ts
│   │   │
│   │   ├── users/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── email.vo.ts
│   │   │   │   │   └── user-id.vo.ts
│   │   │   │   └── events/
│   │   │   │       ├── user-created.event.ts
│   │   │   │       └── user-upgraded.event.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-user.use-case.ts
│   │   │   │   │   ├── upgrade-to-creator.use-case.ts
│   │   │   │   │   └── update-profile.use-case.ts
│   │   │   │   ├── ports/
│   │   │   │   │   └── user.repository.port.ts
│   │   │   │   └── dtos/
│   │   │   │       └── user.dto.ts
│   │   │   └── infrastructure/
│   │   │       ├── prisma-user.repository.ts
│   │   │       └── user.mapper.ts
│   │   │
│   │   ├── creators/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── creator.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── siret.vo.ts
│   │   │   │   │   └── stripe-account-id.vo.ts
│   │   │   │   └── events/
│   │   │   │       ├── creator-onboarded.event.ts
│   │   │   │       └── creator-verified.event.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── onboard-creator.use-case.ts
│   │   │   │   │   ├── verify-siret.use-case.ts
│   │   │   │   │   └── get-creator-stats.use-case.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── creator.repository.port.ts
│   │   │   │   │   └── siret-verification.port.ts
│   │   │   │   └── dtos/
│   │   │   │       └── creator.dto.ts
│   │   │   └── infrastructure/
│   │   │       ├── prisma-creator.repository.ts
│   │   │       ├── insee-siret.adapter.ts
│   │   │       └── creator.mapper.ts
│   │   │
│   │   ├── products/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── product.entity.ts
│   │   │   │   │   └── project.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── price.vo.ts
│   │   │   │   │   └── product-status.vo.ts
│   │   │   │   └── events/
│   │   │   │       └── product-published.event.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-product.use-case.ts
│   │   │   │   │   ├── update-product.use-case.ts
│   │   │   │   │   ├── publish-product.use-case.ts
│   │   │   │   │   └── check-product-limit.use-case.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── product.repository.port.ts
│   │   │   │   │   └── image-upload.port.ts
│   │   │   │   └── dtos/
│   │   │   │       └── product.dto.ts
│   │   │   └── infrastructure/
│   │   │       ├── prisma-product.repository.ts
│   │   │       ├── cloudinary.adapter.ts
│   │   │       └── product.mapper.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── order.entity.ts
│   │   │   │   │   └── order-item.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── order-status.vo.ts
│   │   │   │   │   ├── tracking-number.vo.ts
│   │   │   │   │   └── money.vo.ts
│   │   │   │   └── events/
│   │   │   │       ├── order-paid.event.ts
│   │   │   │       ├── order-shipped.event.ts
│   │   │   │       └── order-completed.event.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-order.use-case.ts
│   │   │   │   │   ├── ship-order.use-case.ts
│   │   │   │   │   ├── complete-order.use-case.ts
│   │   │   │   │   ├── cancel-order.use-case.ts
│   │   │   │   │   └── process-escrow-release.use-case.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── order.repository.port.ts
│   │   │   │   │   ├── payment.port.ts
│   │   │   │   │   └── tracking.port.ts
│   │   │   │   └── dtos/
│   │   │   │       └── order.dto.ts
│   │   │   └── infrastructure/
│   │   │       ├── prisma-order.repository.ts
│   │   │       ├── stripe-connect.adapter.ts
│   │   │       ├── aftership.adapter.ts
│   │   │       └── order.mapper.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── creator-page.entity.ts
│   │   │   │   │   └── page-section.entity.ts
│   │   │   │   └── value-objects/
│   │   │   │       ├── section-type.vo.ts
│   │   │   │       └── page-slug.vo.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-page.use-case.ts
│   │   │   │   │   ├── update-section.use-case.ts
│   │   │   │   │   └── publish-page.use-case.ts
│   │   │   │   ├── ports/
│   │   │   │   │   └── page.repository.port.ts
│   │   │   │   └── dtos/
│   │   │   │       └── page.dto.ts
│   │   │   └── infrastructure/
│   │   │       ├── prisma-page.repository.ts
│   │   │       └── page.mapper.ts
│   │   │
│   │   ├── subscriptions/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── subscription.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── plan.vo.ts
│   │   │   │   │   └── subscription-status.vo.ts
│   │   │   │   └── events/
│   │   │   │       ├── subscription-created.event.ts
│   │   │   │       └── subscription-upgraded.event.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-subscription.use-case.ts
│   │   │   │   │   ├── upgrade-plan.use-case.ts
│   │   │   │   │   ├── cancel-subscription.use-case.ts
│   │   │   │   │   └── check-limits.use-case.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── subscription.repository.port.ts
│   │   │   │   │   └── billing.port.ts
│   │   │   │   └── dtos/
│   │   │   │       └── subscription.dto.ts
│   │   │   └── infrastructure/
│   │   │       ├── prisma-subscription.repository.ts
│   │   │       ├── stripe-billing.adapter.ts
│   │   │       └── subscription.mapper.ts
│   │   │
│   │   └── admin/
│   │       ├── domain/
│   │       │   └── entities/
│   │       │       └── platform-stats.entity.ts
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   │   ├── get-platform-stats.use-case.ts
│   │       │   │   ├── list-creators.use-case.ts
│   │       │   │   ├── disable-account.use-case.ts
│   │       │   │   └── manage-subscription.use-case.ts
│   │       │   └── dtos/
│   │       │       └── admin.dto.ts
│   │       └── infrastructure/
│   │           └── prisma-admin.repository.ts
│   │
│   ├── shared/                        # Shared Kernel
│   │   ├── domain/
│   │   │   ├── entity.base.ts
│   │   │   ├── aggregate-root.base.ts
│   │   │   ├── value-object.base.ts
│   │   │   ├── domain-event.base.ts
│   │   │   ├── unique-id.vo.ts
│   │   │   └── result.ts
│   │   ├── application/
│   │   │   ├── use-case.interface.ts
│   │   │   └── event-bus.interface.ts
│   │   └── infrastructure/
│   │       ├── logger.ts
│   │       └── error-handler.ts
│   │
│   ├── lib/                           # Infrastructure Configuration
│   │   ├── prisma/
│   │   │   ├── client.ts
│   │   │   └── tenant-middleware.ts
│   │   ├── auth/
│   │   │   ├── auth.config.ts
│   │   │   └── auth.ts
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── webhooks.ts
│   │   ├── resend/
│   │   │   └── client.ts
│   │   ├── cloudinary/
│   │   │   └── client.ts
│   │   ├── aftership/
│   │   │   └── client.ts
│   │   ├── insee/
│   │   │   └── client.ts
│   │   └── container.ts               # DI Container
│   │
│   └── components/                    # UI Components
│       ├── ui/                        # shadcn/ui components
│       ├── layout/
│       │   ├── sidebar.tsx
│       │   ├── header.tsx
│       │   └── footer.tsx
│       ├── forms/
│       │   ├── product-form.tsx
│       │   └── checkout-form.tsx
│       └── features/
│           ├── page-builder/
│           └── dashboard/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## Modèle de Données (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum Role {
  CLIENT
  CREATOR
  ADMIN
}

enum Plan {
  FREE
  PRO
  PREMIUM
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  PAUSED
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  VALIDATION_PENDING
  COMPLETED
  DISPUTE_OPENED
  RETURN_SHIPPED
  RETURN_RECEIVED
  REFUNDED
  CANCELED
}

enum SectionType {
  HERO
  ABOUT
  BENTO_GRID
  PRODUCTS_FEATURED
  PRODUCTS_GRID
  TESTIMONIALS
  CONTACT
  CUSTOM
}

// ============================================
// USER & AUTH (Auth.js compatible)
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          Role      @default(CLIENT)

  // OAuth (Auth.js)
  accounts      Account[]
  sessions      Session[]

  // Relations
  creator       Creator?
  orders        Order[]   @relation("BuyerOrders")
  addresses     Address[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([role])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================
// CREATOR
// ============================================

model Creator {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Business info
  brandName         String
  siret             String   @unique
  siretVerified     Boolean  @default(false)
  siretVerifiedAt   DateTime?
  businessAddress   String?
  phone             String?

  // Stripe Connect
  stripeAccountId   String?  @unique
  stripeOnboarded   Boolean  @default(false)
  stripeOnboardedAt DateTime?

  // Settings
  slug              String   @unique
  bio               String?  @db.Text
  logoUrl           String?
  bannerUrl         String?

  // Relations
  subscription      Subscription?
  projects          Project[]
  products          Product[]
  orders            Order[]  @relation("SellerOrders")
  page              CreatorPage?
  customers         Customer[]

  // Stats (dénormalisés pour performance)
  totalRevenue      Decimal  @default(0) @db.Decimal(10, 2)
  totalOrders       Int      @default(0)
  totalProducts     Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([slug])
  @@index([siret])
  @@index([stripeAccountId])
  @@map("creators")
}

// ============================================
// SUBSCRIPTION
// ============================================

model Subscription {
  id                    String             @id @default(cuid())
  creatorId             String             @unique
  creator               Creator            @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  plan                  Plan               @default(FREE)
  status                SubscriptionStatus @default(ACTIVE)

  // Stripe Billing
  stripeSubscriptionId  String?            @unique
  stripeCustomerId      String?
  stripePriceId         String?

  // Limites par plan
  productLimit          Int                @default(5)   // FREE: 5, PRO: -1 (illimité)
  salesLimit            Int                @default(10)  // FREE: 10, PRO: -1 (illimité)
  currentProductCount   Int                @default(0)
  currentSalesCount     Int                @default(0)

  // Cycle de facturation
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean            @default(false)

  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  @@index([stripeSubscriptionId])
  @@index([stripeCustomerId])
  @@map("subscriptions")
}

// ============================================
// PRODUCTS & PROJECTS
// ============================================

model Project {
  id          String    @id @default(cuid())
  creatorId   String
  creator     Creator   @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  name        String
  description String?   @db.Text
  coverImage  String?

  products    Product[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([creatorId])
  @@map("projects")
}

model Product {
  id          String        @id @default(cuid())
  creatorId   String
  creator     Creator       @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  projectId   String?
  project     Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)

  name        String
  description String?       @db.Text
  price       Decimal       @db.Decimal(10, 2)
  comparePrice Decimal?     @db.Decimal(10, 2)
  status      ProductStatus @default(DRAFT)

  // Inventaire
  sku         String?
  quantity    Int           @default(0)
  trackInventory Boolean    @default(false)

  // Media (Cloudinary URLs)
  images      ProductImage[]

  // Variantes
  variants    ProductVariant[]

  // SEO
  metaTitle       String?
  metaDescription String?

  // Relations
  orderItems  OrderItem[]

  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([creatorId])
  @@index([projectId])
  @@index([status])
  @@index([creatorId, status])
  @@map("products")
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  url       String   // Cloudinary URL
  alt       String?
  position  Int      @default(0)

  createdAt DateTime @default(now())

  @@index([productId])
  @@map("product_images")
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  name      String   // ex: "Taille", "Couleur"
  value     String   // ex: "M", "Rouge"
  price     Decimal? @db.Decimal(10, 2)
  sku       String?
  quantity  Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@map("product_variants")
}

// ============================================
// ORDERS & CUSTOMERS
// ============================================

model Customer {
  id        String   @id @default(cuid())
  creatorId String
  creator   Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  email     String
  name      String?
  phone     String?

  orders    Order[]

  // Stats
  totalSpent    Decimal @default(0) @db.Decimal(10, 2)
  totalOrders   Int     @default(0)
  lastOrderAt   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([creatorId, email])
  @@index([creatorId])
  @@map("customers")
}

model Order {
  id          String      @id @default(cuid())
  orderNumber String      @unique @default(cuid())

  // Acheteur
  buyerId     String?
  buyer       User?       @relation("BuyerOrders", fields: [buyerId], references: [id], onDelete: SetNull)
  customerId  String?
  customer    Customer?   @relation(fields: [customerId], references: [id], onDelete: SetNull)

  // Vendeur
  creatorId   String
  creator     Creator     @relation("SellerOrders", fields: [creatorId], references: [id], onDelete: Cascade)

  // Statut
  status      OrderStatus @default(PENDING)

  // Montants
  subtotal        Decimal @db.Decimal(10, 2)
  shippingCost    Decimal @default(0) @db.Decimal(10, 2)
  taxAmount       Decimal @default(0) @db.Decimal(10, 2)
  total           Decimal @db.Decimal(10, 2)
  platformFee     Decimal @db.Decimal(10, 2)  // 3% commission Kpsull
  creatorPayout   Decimal @db.Decimal(10, 2)  // total - platformFee

  // Stripe
  stripePaymentIntentId String? @unique
  stripeTransferId      String?

  // Livraison
  shippingAddressId String?
  shippingAddress   Address? @relation(fields: [shippingAddressId], references: [id])
  shippingCarrier   String?
  trackingNumber    String?
  trackingUrl       String?

  // Timeline Escrow
  paidAt            DateTime?
  shippedAt         DateTime?
  deliveredAt       DateTime?
  validationDeadline DateTime?  // deliveredAt + 48h
  completedAt       DateTime?

  // Items
  items       OrderItem[]

  // Notes
  customerNote String? @db.Text
  sellerNote   String? @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([creatorId])
  @@index([buyerId])
  @@index([customerId])
  @@index([status])
  @@index([stripePaymentIntentId])
  @@index([creatorId, status])
  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])

  name      String  // Snapshot au moment de la commande
  price     Decimal @db.Decimal(10, 2)
  quantity  Int
  variantInfo String? // JSON des variantes sélectionnées

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model Address {
  id          String  @id @default(cuid())
  userId      String?
  user        User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  firstName   String
  lastName    String
  company     String?
  address1    String
  address2    String?
  city        String
  state       String?
  postalCode  String
  country     String  @default("FR")
  phone       String?

  isDefault   Boolean @default(false)

  orders      Order[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@map("addresses")
}

// ============================================
// PAGE BUILDER
// ============================================

model CreatorPage {
  id        String   @id @default(cuid())
  creatorId String   @unique
  creator   Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  title     String?
  published Boolean  @default(false)
  template  String   @default("default")

  // SEO
  metaTitle       String?
  metaDescription String?
  ogImage         String?

  sections  PageSection[]

  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("creator_pages")
}

model PageSection {
  id        String      @id @default(cuid())
  pageId    String
  page      CreatorPage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  type      SectionType
  position  Int         @default(0)
  visible   Boolean     @default(true)

  // Contenu (JSON pour flexibilité)
  content   Json        @default("{}")
  settings  Json        @default("{}")

  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([pageId])
  @@index([pageId, position])
  @@map("page_sections")
}

// ============================================
// AUDIT & NOTIFICATIONS
// ============================================

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  creatorId String?

  action    String
  entity    String
  entityId  String?
  metadata  Json?

  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([creatorId])
  @@index([entity, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String

  type      String
  title     String
  message   String   @db.Text
  data      Json?

  read      Boolean  @default(false)
  readAt    DateTime?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([userId, read])
  @@map("notifications")
}
```

---

## Patterns d'Implémentation

### 1. Entity Base

```typescript
// shared/domain/entity.base.ts
import { UniqueId } from './unique-id.vo';

export abstract class Entity<T> {
  protected readonly _id: UniqueId;
  protected props: T;

  protected constructor(props: T, id?: UniqueId) {
    this._id = id ?? UniqueId.create();
    this.props = props;
  }

  get id(): UniqueId {
    return this._id;
  }

  public equals(entity?: Entity<T>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this._id.equals(entity._id);
  }
}
```

### 2. Value Object Base

```typescript
// shared/domain/value-object.base.ts
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (!vo) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
```

### 3. Result Pattern

```typescript
// shared/domain/result.ts
export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly error?: string,
    private readonly _value?: T
  ) {}

  get value(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value as T;
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }
}
```

### 4. Use Case Interface

```typescript
// shared/application/use-case.interface.ts
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Result<Output>>;
}
```

### 5. Port Interface (Repository)

```typescript
// modules/orders/application/ports/order.repository.port.ts
import { Order } from '../../domain/entities/order.entity';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCreatorId(creatorId: string): Promise<Order[]>;
  findByStatus(creatorId: string, status: OrderStatus): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 6. Adapter Implementation

```typescript
// modules/orders/infrastructure/prisma-order.repository.ts
import { PrismaClient } from '@prisma/client';
import { Order } from '../domain/entities/order.entity';
import { OrderRepository } from '../application/ports/order.repository.port';
import { OrderMapper } from './order.mapper';

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return data ? OrderMapper.toDomain(data) : null;
  }

  async save(order: Order): Promise<void> {
    const data = OrderMapper.toPersistence(order);
    await this.prisma.order.upsert({
      where: { id: order.id.value },
      create: data,
      update: data,
    });
  }
}
```

### 7. Use Case Implementation

```typescript
// modules/orders/application/use-cases/ship-order.use-case.ts
import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { OrderRepository } from '../ports/order.repository.port';
import { TrackingPort } from '../ports/tracking.port';
import { EmailPort } from '../ports/email.port';
import { OrderDTO } from '../dtos/order.dto';
import { OrderMapper } from '../../infrastructure/order.mapper';

export interface ShipOrderInput {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  creatorId: string;
}

export class ShipOrderUseCase implements UseCase<ShipOrderInput, OrderDTO> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly trackingService: TrackingPort,
    private readonly emailService: EmailPort
  ) {}

  async execute(input: ShipOrderInput): Promise<Result<OrderDTO>> {
    // 1. Charger la commande
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      return Result.fail('Order not found');
    }

    // 2. Vérifier ownership
    if (order.creatorId !== input.creatorId) {
      return Result.fail('Unauthorized');
    }

    // 3. Exécuter la logique domaine
    const shipResult = order.ship(input.trackingNumber, input.carrier);
    if (shipResult.isFailure) {
      return Result.fail(shipResult.error!);
    }

    // 4. Enregistrer le tracking
    await this.trackingService.registerShipment({
      trackingNumber: input.trackingNumber,
      carrier: input.carrier,
      orderId: order.id.value,
    });

    // 5. Persister
    await this.orderRepository.save(order);

    // 6. Envoyer notification email
    await this.emailService.sendOrderShippedEmail(order);

    return Result.ok(OrderMapper.toDTO(order));
  }
}
```

### 8. API Route Handler

```typescript
// app/api/orders/[id]/ship/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { container } from '@/lib/container';
import { ShipOrderUseCase } from '@/modules/orders/application/use-cases/ship-order.use-case';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérifier auth
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parser body
    const body = await request.json();
    const { trackingNumber, carrier } = body;

    // 3. Récupérer use case depuis DI container
    const shipOrderUseCase = container.resolve(ShipOrderUseCase);

    // 4. Exécuter
    const result = await shipOrderUseCase.execute({
      orderId: params.id,
      trackingNumber,
      carrier,
      creatorId: session.user.creatorId!,
    });

    // 5. Retourner résultat
    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Ship order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Intégrations Externes

### Stripe Connect (Escrow Payments)

```typescript
// lib/stripe/client.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// modules/orders/infrastructure/stripe-connect.adapter.ts
import { stripe } from '@/lib/stripe/client';
import { PaymentPort, CreatePaymentIntentParams } from '../application/ports/payment.port';

export class StripeConnectAdapter implements PaymentPort {
  async createPaymentIntent(params: CreatePaymentIntentParams) {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Centimes
      currency: 'eur',
      transfer_data: {
        destination: params.stripeAccountId,
      },
      application_fee_amount: Math.round(params.platformFee * 100), // 3%
      metadata: {
        orderId: params.orderId,
        creatorId: params.creatorId,
      },
      // Escrow: ne pas transférer immédiatement
      transfer_group: params.orderId,
    });

    return {
      id: intent.id,
      clientSecret: intent.client_secret!,
      status: intent.status,
    };
  }

  async releaseEscrow(orderId: string, amount: number, stripeAccountId: string) {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      destination: stripeAccountId,
      transfer_group: orderId,
    });

    return { id: transfer.id };
  }

  async refund(paymentIntentId: string) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    return { id: refund.id };
  }
}
```

### Resend (Emails)

```typescript
// lib/resend/client.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

// modules/shared/infrastructure/resend-email.adapter.ts
import { resend } from '@/lib/resend/client';
import { EmailPort } from '../application/ports/email.port';

export class ResendEmailAdapter implements EmailPort {
  async sendOrderConfirmation(order: Order, customerEmail: string) {
    await resend.emails.send({
      from: 'Kpsull <noreply@kpsull.com>',
      to: customerEmail,
      subject: `Confirmation de commande #${order.orderNumber}`,
      react: OrderConfirmationEmail({ order }),
    });
  }

  async sendOrderShippedEmail(order: Order) {
    await resend.emails.send({
      from: 'Kpsull <noreply@kpsull.com>',
      to: order.customerEmail,
      subject: `Votre commande #${order.orderNumber} a été expédiée`,
      react: OrderShippedEmail({ order }),
    });
  }
}
```

### Cloudinary (Images CDN)

```typescript
// lib/cloudinary/client.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// modules/products/infrastructure/cloudinary.adapter.ts
import { cloudinary } from '@/lib/cloudinary/client';
import { ImageUploadPort } from '../application/ports/image-upload.port';

export class CloudinaryAdapter implements ImageUploadPort {
  async upload(file: Buffer, options: { folder: string }) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `kpsull/${options.folder}`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve({ url: result!.secure_url, publicId: result!.public_id });
        }
      ).end(file);
    });
  }

  async delete(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
  }
}
```

### AfterShip (Tracking)

```typescript
// lib/aftership/client.ts
import AfterShip from 'aftership';

export const aftership = new AfterShip(process.env.AFTERSHIP_API_KEY!);

// modules/orders/infrastructure/aftership.adapter.ts
import { aftership } from '@/lib/aftership/client';
import { TrackingPort } from '../application/ports/tracking.port';

export class AfterShipAdapter implements TrackingPort {
  async registerShipment(params: {
    trackingNumber: string;
    carrier: string;
    orderId: string;
  }) {
    const tracking = await aftership.tracking.createTracking({
      tracking_number: params.trackingNumber,
      slug: params.carrier,
      custom_fields: { order_id: params.orderId },
    });

    return {
      id: tracking.tracking.id,
      status: tracking.tracking.tag,
    };
  }

  async getStatus(trackingNumber: string) {
    const tracking = await aftership.tracking.getTracking({
      tracking_number: trackingNumber,
    });

    return {
      status: tracking.tracking.tag,
      deliveredAt: tracking.tracking.subtag === 'Delivered_001'
        ? new Date(tracking.tracking.last_updated_at)
        : undefined,
    };
  }
}
```

### INSEE SIRET Verification

```typescript
// lib/insee/client.ts
const INSEE_API_URL = 'https://api.insee.fr/entreprises/sirene/V3';

export async function verifySiret(siret: string): Promise<{
  valid: boolean;
  company?: { name: string; address: string };
}> {
  const response = await fetch(
    `${INSEE_API_URL}/siret/${siret}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INSEE_API_TOKEN}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    return { valid: false };
  }

  const data = await response.json();
  const etablissement = data.etablissement;

  return {
    valid: true,
    company: {
      name: etablissement.uniteLegale.denominationUniteLegale,
      address: `${etablissement.adresseEtablissement.numeroVoieEtablissement} ${etablissement.adresseEtablissement.typeVoieEtablissement} ${etablissement.adresseEtablissement.libelleVoieEtablissement}`,
    },
  };
}
```

---

## Stratégie de Tests (TDD)

### Pyramide de Tests

```
        /\
       /  \     E2E Tests (Playwright)
      /----\    - Parcours utilisateur critiques
     /      \   - 10-15 tests
    /--------\  Integration Tests (Vitest)
   /          \ - API routes + repositories
  /------------\- 50-100 tests
 /              \ Unit Tests (Vitest)
/________________\- Domain + Use Cases
                  - 200+ tests
```

### Configuration Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Exemple Test Unitaire (TDD)

```typescript
// modules/orders/domain/__tests__/order.entity.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../value-objects/order-status.vo';
import { Money } from '../value-objects/money.vo';

describe('Order Entity', () => {
  describe('create', () => {
    it('should create order with valid items', () => {
      const result = Order.create({
        creatorId: 'creator-123',
        items: [
          { productId: 'prod-1', name: 'Test', quantity: 2, price: 50 },
        ],
        total: Money.create(100),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status.value).toBe(OrderStatus.PENDING);
      expect(result.value.platformFee.amount).toBe(3); // 3%
      expect(result.value.creatorPayout.amount).toBe(97);
    });

    it('should fail with empty items', () => {
      const result = Order.create({
        creatorId: 'creator-123',
        items: [],
        total: Money.create(0),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Order must have at least one item');
    });
  });

  describe('ship', () => {
    it('should transition from PAID to SHIPPED', () => {
      const order = createPaidOrder();

      const result = order.ship('TRACK123', 'colissimo');

      expect(result.isSuccess).toBe(true);
      expect(order.status.value).toBe(OrderStatus.SHIPPED);
      expect(order.trackingNumber).toBe('TRACK123');
    });

    it('should fail if order is not paid', () => {
      const order = createPendingOrder();

      const result = order.ship('TRACK123', 'colissimo');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Only paid orders can be shipped');
    });
  });

  describe('complete', () => {
    it('should release escrow after 48h validation', () => {
      const order = createDeliveredOrder();
      // Simuler 48h passées
      order.setDeliveredAt(new Date(Date.now() - 49 * 60 * 60 * 1000));

      const result = order.complete();

      expect(result.isSuccess).toBe(true);
      expect(order.status.value).toBe(OrderStatus.COMPLETED);
    });
  });
});

// Helpers
function createPaidOrder(): Order {
  const order = Order.create({
    creatorId: 'creator-123',
    items: [{ productId: 'prod-1', name: 'Test', quantity: 1, price: 100 }],
    total: Money.create(100),
  }).value;
  order.markAsPaid('pi_test');
  return order;
}

function createPendingOrder(): Order {
  return Order.create({
    creatorId: 'creator-123',
    items: [{ productId: 'prod-1', name: 'Test', quantity: 1, price: 100 }],
    total: Money.create(100),
  }).value;
}
```

### Exemple Test E2E (Playwright)

```typescript
// tests/e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
  test('complete purchase as client', async ({ page }) => {
    // 1. Visiter page créateur
    await page.goto('/sophie-creations');
    await expect(page.getByText('Sophie Créations')).toBeVisible();

    // 2. Ajouter au panier
    await page.click('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart"]');

    // 3. Aller au checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // 4. Remplir adresse
    await page.fill('[name="firstName"]', 'Emma');
    await page.fill('[name="lastName"]', 'Test');
    await page.fill('[name="address1"]', '123 Rue Test');
    await page.fill('[name="city"]', 'Paris');
    await page.fill('[name="postalCode"]', '75001');

    // 5. Payer (Stripe test card)
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('[name="exp-date"]').fill('12/30');
    await stripeFrame.locator('[name="cvc"]').fill('123');

    await page.click('[data-testid="pay-button"]');

    // 6. Vérifier succès
    await expect(page).toHaveURL(/\/success/);
    await expect(page.getByText('Commande confirmée')).toBeVisible();
  });
});
```

---

## Variables d'Environnement

```bash
# .env.local

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kpsull?schema=public"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend
RESEND_API_KEY="re_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# AfterShip
AFTERSHIP_API_KEY="your-api-key"

# INSEE
INSEE_API_TOKEN="your-insee-token"
```

---

## Checklist d'Implémentation

### Phase 1: Setup
- [ ] Créer `apps/web` Next.js 15
- [ ] Configurer TailwindCSS + shadcn/ui
- [ ] Setup Prisma avec schema complet
- [ ] Configurer Auth.js + Google OAuth
- [ ] Setup Vitest + Playwright

### Phase 2: Shared Kernel
- [ ] Implémenter Entity, AggregateRoot, ValueObject base classes
- [ ] Implémenter Result pattern
- [ ] Implémenter DomainEvent infrastructure
- [ ] Configurer DI Container

### Phase 3: Modules (TDD)
- [ ] Module Auth (login, logout, session)
- [ ] Module Users (CRUD, upgrade)
- [ ] Module Creators (onboarding, SIRET)
- [ ] Module Products (CRUD, images, variantes)
- [ ] Module Orders (escrow flow complet)
- [ ] Module Pages (Page Builder)
- [ ] Module Subscriptions (plans, limites)
- [ ] Module Admin (dashboard, gestion)

### Phase 4: Intégrations
- [ ] Stripe Connect + Billing
- [ ] Resend emails
- [ ] Cloudinary images
- [ ] AfterShip tracking
- [ ] INSEE SIRET

### Phase 5: UI
- [ ] Dashboard créateur
- [ ] Admin backoffice
- [ ] Pages créateurs publiques
- [ ] Checkout flow
- [ ] Page Builder

### Phase 6: Finalisation
- [ ] E2E tests critiques
- [ ] Supprimer `apps/backend`
- [ ] Documentation API
- [ ] Déploiement
