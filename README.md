# KpSull - Plateforme Créateurs & Clients

> Plateforme moderne de connexion entre créateurs de contenu et clients avec authentification sécurisée et gestion d'abonnements.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)
[![Tests](https://img.shields.io/badge/Tests-23%20passing-success)](/)

## Documentation IA

Pour une documentation complète du projet, de l'architecture et des bonnes pratiques, consultez **[CLAUDE.md](./CLAUDE.md)** qui contient :

- Architecture monorepo détaillée
- Principes SOLID avec exemples TypeScript
- Méthodologie TDD (Red-Green-Refactor)
- Conventions de code et Git workflow
- Stack technique et dépendances

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 16+
- npm/pnpm/yarn

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd kpsull

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env

# Configurer la base de données
cd apps/backend
npx prisma migrate dev
npx prisma generate
cd ../..
```

### Lancement en développement

```bash
# Lancer tous les projets (frontend + backend)
npm run dev

# Ou lancer séparément
npm run dev --filter=frontend  # Frontend sur http://localhost:3000
npm run dev --filter=backend   # Backend sur http://localhost:3001
```

## Structure du monorepo

```
kpsull/
├── apps/
│   ├── frontend/          # Next.js 15 + TypeScript + Tailwind 4
│   │   ├── src/
│   │   │   ├── app/       # App Router (pages)
│   │   │   ├── components/# Composants React + shadcn/ui
│   │   │   ├── lib/       # Utilities (BetterAuth, etc.)
│   │   │   └── types/     # Types TypeScript
│   │   ├── e2e/           # Tests Playwright
│   │   └── vitest.config.ts
│   │
│   └── backend/           # NestJS 10 + Prisma + PostgreSQL
│       ├── src/
│       │   ├── auth/      # Module d'authentification
│       │   ├── users/     # Module utilisateurs
│       │   └── prisma/    # Prisma client
│       └── test/          # Tests E2E
│
├── packages/
│   ├── eslint-config/     # Configurations ESLint partagées
│   ├── typescript-config/ # Configurations TypeScript partagées
│   └── utils/             # Utilitaires partagés
│
├── .github/
│   └── workflows/         # CI/CD GitHub Actions
│
├── CLAUDE.md              # Documentation complète pour IA
├── sonar-project.properties
├── commitlint.config.js
└── turbo.json
```

## Stack technique

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Langage**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui + Radix UI
- **Auth**: BetterAuth (JWT + OAuth)
- **Forms**: React Hook Form + Zod
- **Tests**: Vitest + Playwright

### Backend

- **Framework**: NestJS 10
- **Langage**: TypeScript 5
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: JWT + BetterAuth
- **Tests**: Vitest + Supertest

### DevOps

- **Monorepo**: Turborepo
- **CI/CD**: GitHub Actions
- **Quality**: SonarQube, ESLint, Prettier
- **Git Hooks**: Husky + Commitlint

## Scripts disponibles

### Développement

```bash
npm run dev              # Lancer tous les projets
npm run dev --filter=frontend
npm run dev --filter=backend
```

### Tests

```bash
npm run test             # Tous les tests unitaires
npm run test:coverage    # Tests avec couverture
npm run test:e2e         # Tests E2E (Playwright + Supertest)
npm run test:all         # Unit + E2E
```

### Qualité

```bash
npm run quality          # Lint + format check + coverage
npm run quality:fix      # Lint fix + format
npm run lint             # ESLint
npm run format           # Prettier
```

### Build

```bash
npm run build            # Build tous les projets
npm run build --filter=frontend
npm run build --filter=backend
```

> **Note**: Le build Next.js 15.5.5 a un problème connu avec la pré-génération de la page 404. Voir [apps/frontend/BUILD_KNOWN_ISSUES.md](./apps/frontend/BUILD_KNOWN_ISSUES.md). Le mode développement fonctionne parfaitement.

## Conventions Git

Ce projet utilise **Conventional Commits** avec Commitlint :

```bash
feat: ajout d'une nouvelle fonctionnalité
fix: correction d'un bug
docs: modification de documentation
style: formatage du code
refactor: refactoring sans changement fonctionnel
test: ajout ou modification de tests
chore: tâches de maintenance
```

Les commits sont validés automatiquement via Husky hooks.

## Tests et TDD

Le projet suit une approche **Test-Driven Development** stricte :

1. **Red**: Écrire un test qui échoue
2. **Green**: Écrire le code minimal pour passer le test
3. **Refactor**: Améliorer le code en gardant les tests verts

### Couverture de code

Seuils minimums (80%) :

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

### Tests actuels

- ✅ 23 tests frontend (Vitest + React Testing Library)
- ✅ Tests backend E2E (Supertest)
- ✅ Tests E2E frontend (Playwright)

## Fonctionnalités

### Implémenté

- ✅ Authentification Email/Password
- ✅ OAuth Google & Apple (configuration)
- ✅ Gestion des rôles (CLIENT/CREATOR)
- ✅ Interface utilisateur moderne
- ✅ Tests automatisés (23 tests)
- ✅ CI/CD GitHub Actions
- ✅ Quality gates (SonarQube, ESLint, Prettier)

### Roadmap

- [ ] Plans payants pour créateurs (3 formules)
- [ ] Dashboard créateur avancé
- [ ] Système de paiement
- [ ] Gestion de contenu
- [ ] Analytics et statistiques
- [ ] Messagerie entre utilisateurs

## Documentation complémentaire

- **[CLAUDE.md](./CLAUDE.md)**: Documentation complète pour IA et développeurs
- **[apps/frontend/BUILD_KNOWN_ISSUES.md](./apps/frontend/BUILD_KNOWN_ISSUES.md)**: Problèmes connus de build
- **[Turborepo Docs](https://turborepo.com/docs)**: Documentation Turborepo
- **[Next.js Docs](https://nextjs.org/docs)**: Documentation Next.js
- **[NestJS Docs](https://docs.nestjs.com/)**: Documentation NestJS

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
