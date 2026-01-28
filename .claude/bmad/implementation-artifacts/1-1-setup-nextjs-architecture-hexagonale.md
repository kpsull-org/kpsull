# Story 1.1: Setup Projet Next.js 15 avec Architecture Hexagonale

Status: review

## Story

As a développeur,
I want un projet Next.js 15 configuré avec l'architecture hexagonale,
so that je puisse développer les fonctionnalités avec une base solide et testable.

## Acceptance Criteria

1. **AC1 - Projet Next.js 15 créé**
   - **Given** un nouveau projet Next.js 15
   - **When** je configure le projet
   - **Then** le projet est créé avec App Router et TypeScript strict mode

2. **AC2 - Stack UI configurée**
   - **Given** le projet Next.js
   - **When** je configure les dépendances UI
   - **Then** TailwindCSS 4.x et shadcn/ui sont installés et fonctionnels

3. **AC3 - Structure hexagonale en place**
   - **Given** le projet configuré
   - **When** je crée la structure de dossiers
   - **Then** les dossiers `src/modules/`, `src/shared/`, `src/lib/` existent avec la hiérarchie documentée

4. **AC4 - Prisma configuré**
   - **Given** le projet avec structure
   - **When** je configure Prisma
   - **Then** Prisma est configuré avec les modèles Auth.js de base (User, Account, Session, VerificationToken)

5. **AC5 - Shared Kernel implémenté**
   - **Given** Prisma configuré
   - **When** j'implémente le shared kernel
   - **Then** les classes `Entity`, `ValueObject`, `Result`, `UniqueId`, `AggregateRoot`, `DomainEvent` sont implémentées dans `src/shared/domain/`

6. **AC6 - Tests unitaires configurés**
   - **Given** le shared kernel implémenté
   - **When** je configure Vitest
   - **Then** Vitest est configuré et les tests du shared kernel passent

## Tasks / Subtasks

- [x] **Task 1: Créer le projet Next.js 15** (AC: #1)
  - [x] 1.1 Exécuter `npx create-next-app@latest apps/web` avec App Router, TypeScript, TailwindCSS, ESLint
  - [x] 1.2 Vérifier la structure initiale créée
  - [x] 1.3 Configurer TypeScript strict mode dans `tsconfig.json`

- [x] **Task 2: Configurer TailwindCSS et shadcn/ui** (AC: #2)
  - [x] 2.1 Vérifier TailwindCSS 4.x installé par create-next-app
  - [x] 2.2 Initialiser shadcn/ui avec `npx shadcn@latest init`
  - [x] 2.3 Configurer le thème de base (CSS variables)
  - [x] 2.4 Ajouter quelques composants de base : Button, Card, Input

- [x] **Task 3: Créer la structure de dossiers hexagonale** (AC: #3)
  - [x] 3.1 Créer `src/modules/` avec sous-dossiers pour futurs modules
  - [x] 3.2 Créer `src/shared/domain/`, `src/shared/application/`, `src/shared/infrastructure/`
  - [x] 3.3 Créer `src/lib/` pour configurations externes (prisma/, auth/, stripe/, etc.)
  - [x] 3.4 Créer `src/components/ui/` et `src/components/layout/`

- [x] **Task 4: Configurer Prisma ORM** (AC: #4)
  - [x] 4.1 Installer Prisma et @prisma/client
  - [x] 4.2 Exécuter `npx prisma init`
  - [x] 4.3 Créer le schéma de base avec User, Account, Session, VerificationToken (Auth.js compatible)
  - [x] 4.4 Créer les enums Role, Plan, SubscriptionStatus, ProductStatus, OrderStatus, SectionType
  - [x] 4.5 Configurer le client Prisma dans `src/lib/prisma/client.ts`
  - [x] 4.6 Créer le fichier `.env.local` avec DATABASE_URL template

- [x] **Task 5: Implémenter le Shared Kernel** (AC: #5)
  - [x] 5.1 Créer `src/shared/domain/unique-id.vo.ts` - Value Object pour IDs
  - [x] 5.2 Créer `src/shared/domain/entity.base.ts` - Classe de base Entity
  - [x] 5.3 Créer `src/shared/domain/value-object.base.ts` - Classe de base ValueObject
  - [x] 5.4 Créer `src/shared/domain/aggregate-root.base.ts` - Classe de base AggregateRoot
  - [x] 5.5 Créer `src/shared/domain/domain-event.base.ts` - Interface DomainEvent
  - [x] 5.6 Créer `src/shared/domain/result.ts` - Pattern Result pour error handling
  - [x] 5.7 Créer `src/shared/application/use-case.interface.ts` - Interface UseCase
  - [x] 5.8 Créer index.ts pour exports publics

- [x] **Task 6: Configurer Vitest** (AC: #6)
  - [x] 6.1 Installer vitest, @vitest/coverage-v8
  - [x] 6.2 Créer `vitest.config.ts` avec alias @ vers src/
  - [x] 6.3 Ajouter scripts npm: `test`, `test:watch`, `test:coverage`
  - [x] 6.4 Écrire tests unitaires pour Entity, ValueObject, Result
  - [x] 6.5 Vérifier que tous les tests passent

## Dev Notes

### Architecture Hexagonale - Rappel Structure

```
src/modules/{module}/
├── domain/           # Coeur métier (0 dépendance externe)
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── errors/
├── application/      # Orchestration (dépend uniquement du domain)
│   ├── use-cases/
│   ├── ports/        # Interfaces (contrats)
│   └── dtos/
└── infrastructure/   # Implémentation technique
    ├── repositories/
    ├── services/
    └── mappers/
```

### Patterns d'Implémentation Requis

**Entity Base** [Source: architecture.md#Patterns d'Implémentation]
```typescript
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

**Value Object Base** [Source: architecture.md#Patterns d'Implémentation]
```typescript
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

**Result Pattern** [Source: architecture.md#Patterns d'Implémentation]
```typescript
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

### Prisma Schema de Base (Auth.js Compatible)

[Source: architecture.md#Modèle de Données]

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
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

// Auth.js Models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          Role      @default(CLIENT)

  accounts      Account[]
  sessions      Session[]

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
```

### Configuration Vitest

[Source: architecture.md#Configuration Vitest]

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

### Variables d'Environnement Template

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kpsull?schema=public"
```

### Project Structure Notes

**Structure finale attendue:**
```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router (existant)
│   ├── modules/                # Architecture hexagonale (à créer)
│   ├── shared/                 # Shared Kernel (à créer)
│   │   ├── domain/
│   │   │   ├── entity.base.ts
│   │   │   ├── aggregate-root.base.ts
│   │   │   ├── value-object.base.ts
│   │   │   ├── domain-event.base.ts
│   │   │   ├── unique-id.vo.ts
│   │   │   ├── result.ts
│   │   │   └── index.ts
│   │   ├── application/
│   │   │   ├── use-case.interface.ts
│   │   │   └── index.ts
│   │   └── infrastructure/
│   │       └── index.ts
│   ├── lib/                    # Config infrastructure (à créer)
│   │   └── prisma/
│   │       └── client.ts
│   └── components/             # UI Components
│       └── ui/                 # shadcn/ui
├── prisma/
│   └── schema.prisma
├── tests/
│   └── unit/
├── vitest.config.ts
└── package.json
```

### Commandes Clés

```bash
# Création projet
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input

# Prisma
npm install prisma @prisma/client
npx prisma init
npx prisma generate
npx prisma db push

# Vitest
npm install -D vitest @vitest/coverage-v8
```

### Alignment avec Architecture

- ✅ Respect de la structure hexagonale documentée
- ✅ Utilisation des patterns Result, Entity, ValueObject
- ✅ Prisma schema compatible Auth.js
- ✅ TDD avec Vitest comme documenté

### References

- [Source: architecture.md#ADR-001: Migration NestJS vers Next.js Full-Stack]
- [Source: architecture.md#ADR-002: Architecture Hexagonale]
- [Source: architecture.md#ADR-003: Stack Technique]
- [Source: architecture.md#Structure de Dossiers Complète]
- [Source: architecture.md#Patterns d'Implémentation]
- [Source: architecture.md#Configuration Vitest]
- [Source: epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Pas d'erreurs majeures rencontrées

### Completion Notes List

1. ✅ Renommé `apps/frontend` en `apps/web` selon l'architecture ADR-001
2. ✅ Configuré TypeScript strict mode avec options supplémentaires (`noUncheckedIndexedAccess`, `noImplicitOverride`)
3. ✅ Installé et configuré shadcn/ui manuellement (dépendances + composants Button/Card/Input)
4. ✅ Configuré le thème shadcn/ui avec CSS variables complètes (light/dark mode)
5. ✅ Créé la structure de dossiers hexagonale complète avec .gitkeep
6. ✅ Configuré Prisma 7.x avec nouvelle config (prisma.config.ts au lieu de url dans schema)
7. ✅ Créé le schema Prisma avec tous les enums et modèles Auth.js
8. ✅ Implémenté le Shared Kernel complet avec documentation JSDoc
9. ✅ Configuré Vitest avec 36 tests unitaires passants
10. ✅ Ajouté méthodes utilitaires au Result pattern (map, flatMap, getOrElse, combine)

### File List

**Nouveaux fichiers:**
- `apps/web/src/lib/utils.ts`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/index.ts`
- `apps/web/src/modules/.gitkeep`
- `apps/web/src/lib/auth/.gitkeep`
- `apps/web/src/lib/stripe/.gitkeep`
- `apps/web/src/lib/resend/.gitkeep`
- `apps/web/src/lib/cloudinary/.gitkeep`
- `apps/web/src/lib/aftership/.gitkeep`
- `apps/web/src/components/layout/.gitkeep`
- `apps/web/src/lib/prisma/client.ts`
- `apps/web/src/shared/domain/unique-id.vo.ts`
- `apps/web/src/shared/domain/value-object.base.ts`
- `apps/web/src/shared/domain/entity.base.ts`
- `apps/web/src/shared/domain/aggregate-root.base.ts`
- `apps/web/src/shared/domain/domain-event.base.ts`
- `apps/web/src/shared/domain/result.ts`
- `apps/web/src/shared/domain/index.ts`
- `apps/web/src/shared/application/use-case.interface.ts`
- `apps/web/src/shared/application/index.ts`
- `apps/web/src/shared/infrastructure/index.ts`
- `apps/web/src/shared/index.ts`
- `apps/web/src/shared/domain/__tests__/result.test.ts`
- `apps/web/src/shared/domain/__tests__/value-object.test.ts`
- `apps/web/src/shared/domain/__tests__/entity.test.ts`
- `apps/web/vitest.config.ts`
- `apps/web/.env.local`
- `apps/web/prisma/schema.prisma`
- `apps/web/prisma.config.ts`

**Fichiers modifiés:**
- `apps/web/package.json` - Renommé, ajout scripts test, dépendances
- `apps/web/tsconfig.json` - Options TypeScript strictes
- `apps/web/src/app/globals.css` - Variables shadcn/ui

**Fichiers renommés:**
- `apps/frontend/` → `apps/web/`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Story implémentée - Setup complet Next.js 15 + Architecture Hexagonale + Shared Kernel + Vitest | Claude Opus 4.5 |
