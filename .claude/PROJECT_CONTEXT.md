# KpSull - Contexte Essentiel du Projet

> **But de ce document** : Fournir rapidement le contexte minimum nécessaire pour qu'une IA puisse travailler efficacement sur le projet sans consommer trop de tokens.

## 🎯 Vue d'ensemble en 30 secondes

**KpSull** est une plateforme de connexion entre **créateurs de contenu** et **clients** avec :

- Authentification sécurisée (Email/Password + OAuth)
- Gestion des rôles (CLIENT/CREATOR)
- Plans payants pour créateurs (à venir)
- Dashboard créateur avancé (à venir)

## 📁 Architecture Monorepo (Turborepo)

```
kpsull/
├── apps/
│   ├── frontend/     # Next.js 15 + TypeScript + Tailwind 4 + shadcn/ui
│   └── backend/      # NestJS 10 + Prisma + PostgreSQL + JWT
├── packages/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── utils/
└── .claude/          # Configuration IA + Agents + Workflows
```

## 🛠️ Stack Technique (Minimal)

| Domaine      | Technologies                                                           |
| ------------ | ---------------------------------------------------------------------- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind 4, shadcn/ui, BetterAuth |
| **Backend**  | NestJS 10, Prisma ORM, PostgreSQL 16, JWT                              |
| **Tests**    | Vitest (unit), Playwright (E2E), 23 tests ✅                           |
| **Quality**  | ESLint, Prettier, Husky, Commitlint, SonarQube                         |
| **Monorepo** | Turborepo, npm workspaces                                              |

## 🔐 Authentification (BetterAuth)

**Fichier principal** : `apps/frontend/src/lib/auth.ts` et `apps/backend/src/auth/`

**Providers actifs** :

- ✅ Email/Password
- ✅ Google OAuth (configuré)
- ✅ Apple OAuth (configuré)

**Schéma utilisateur** (Prisma) :

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(CLIENT)
  createdAt DateTime @default(now())
}

enum Role {
  CLIENT
  CREATOR
}
```

## 🧪 Tests & TDD

**Approche** : Test-Driven Development strict (Red-Green-Refactor)

**Couverture minimale** : 80% (lines, functions, branches, statements)

**Commandes rapides** :

```bash
npm run test              # Tous les tests unitaires
npm run test:e2e          # E2E (Playwright + Supertest)
npm run test:coverage     # Avec couverture
```

**Tests actuels** : 23 tests passants

- 10 tests utils (`src/lib/utils.test.ts`)
- 13 tests Button (`src/components/ui/button.test.tsx`)

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Configuration DB
cd apps/backend && npx prisma migrate dev && npx prisma generate && cd ../..

# Lancement dev
npm run dev                    # Tout (frontend + backend)
npm run dev --filter=frontend  # Frontend seul (port 3000)
npm run dev --filter=backend   # Backend seul (port 3001)
```

## 📋 Conventions Git (Commitlint)

```
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
test:     Ajout/modification de tests
docs:     Documentation
refactor: Refactoring sans changement fonctionnel
chore:    Maintenance (deps, config, etc.)
```

**Hooks actifs** : Pre-commit (lint-staged), Commit-msg (commitlint)

## ⚠️ Points d'attention

1. **Build Next.js** : Problème connu avec page 404 (voir `apps/frontend/BUILD_KNOWN_ISSUES.md`)
   - ✅ Dev mode fonctionne parfaitement
   - ❌ Production build échoue sur pré-génération 404
   - **Solution** : Utiliser `npm run dev` en développement

2. **Prisma** : Toujours run `npx prisma generate` après migration

3. **Variables d'environnement** :
   - Frontend : `.env` avec `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_API_URL`
   - Backend : `.env` avec `DATABASE_URL`, `JWT_SECRET`

## 🎯 Principes de Code (SOLID)

Le projet suit **strictement** les principes SOLID. Exemples complets dans `CLAUDE.md`.

**Résumé rapide** :

- **S** : Une classe = une responsabilité
- **O** : Ouvert à l'extension, fermé à la modification
- **L** : Les sous-types doivent être substituables
- **I** : Interfaces petites et spécifiques
- **D** : Dépendre des abstractions, pas des implémentations

## 📚 Documentation Complète

Pour plus de détails :

- **Architecture & SOLID** : `/CLAUDE.md` (600+ lignes)
- **README principal** : `/README.md`
- **Problèmes build** : `/apps/frontend/BUILD_KNOWN_ISSUES.md`
- **Agents IA** : `/.claude/AGENTS.md`
- **Workflows** : `/.claude/WORKFLOWS.md`
- **Outils** : `/.claude/TOOLS.md`

## 🎨 Structure Frontend (Pages principales)

```
src/app/
├── page.tsx                    # Landing page
├── auth/
│   ├── login/page.tsx         # Connexion
│   └── register/page.tsx      # Inscription (avec choix de rôle)
└── api/
    └── auth/[...all]/route.ts # BetterAuth routes
```

## 🔧 Structure Backend (Modules principaux)

```
src/
├── auth/
│   ├── auth.controller.ts     # Routes auth
│   ├── auth.service.ts        # Logique métier
│   └── jwt.strategy.ts        # JWT Passport strategy
├── users/
│   ├── users.controller.ts
│   └── users.service.ts
└── prisma/
    └── prisma.service.ts      # Prisma client singleton
```

## 💡 Tips pour économiser le contexte

1. **Lire ce fichier en premier** pour comprendre le projet
2. **Utiliser les agents** (voir `.claude/AGENTS.md`) pour les tâches spécialisées
3. **Suivre les workflows** (voir `.claude/WORKFLOWS.md`) pour les processus répétitifs
4. **Référencer CLAUDE.md** uniquement pour les détails SOLID/TDD
5. **Utiliser Grep/Glob** pour trouver du code spécifique au lieu de lire tous les fichiers
6. **Lire uniquement les fichiers pertinents** à la tâche en cours

## 🚦 État Actuel du Projet

**Phase** : MVP fonctionnel ✅

**Fonctionnalités complètes** :

- ✅ Auth Email/Password
- ✅ OAuth Google & Apple (config)
- ✅ Gestion rôles CLIENT/CREATOR
- ✅ UI moderne (shadcn/ui)
- ✅ Tests automatisés (23)
- ✅ CI/CD GitHub Actions
- ✅ Quality gates

**Prochaines étapes (Roadmap)** :

- [ ] Plans payants créateurs (3 formules)
- [ ] Dashboard créateur avancé
- [ ] Système de paiement (Stripe)
- [ ] Gestion de contenu
- [ ] Analytics
- [ ] Messagerie

## 🔍 Recherche Rapide

**Trouver une fonctionnalité** :

```bash
# Grep pour rechercher du code
grep -r "fonction_recherchee" apps/frontend/src/

# Glob pour trouver des fichiers
find apps/ -name "*auth*"
```

**Fichiers clés à connaître** :

- Auth frontend : `apps/frontend/src/lib/auth.ts`
- Auth backend : `apps/backend/src/auth/auth.service.ts`
- Schéma DB : `apps/backend/prisma/schema.prisma`
- Config Turbo : `turbo.json`
- Tests utils : `apps/frontend/src/lib/utils.test.ts`

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-16
