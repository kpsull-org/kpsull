# Outils et Commandes KpSull

> **But** : Référence complète des outils, commandes et scripts disponibles pour optimiser le développement.

## 🛠️ Outils de Développement

### 1. **Turborepo** (Monorepo Management)

**Description** : Orchestrateur de build haute performance pour monorepos

**Commandes principales** :

```bash
# Développement
turbo dev                      # Lance tous les projets en dev
turbo dev --filter=frontend    # Lance uniquement le frontend
turbo dev --filter=backend     # Lance uniquement le backend

# Build
turbo build                    # Build tous les projets
turbo build --filter=frontend  # Build frontend uniquement
turbo build --force            # Force rebuild sans cache

# Tests
turbo test                     # Tous les tests
turbo test:coverage            # Tests avec couverture
turbo test:e2e                 # Tests E2E uniquement

# Nettoyage
turbo clean                    # Nettoie les artifacts de build
```

**Configuration** : `turbo.json`

**Tips** :

- Le cache accélère les builds répétitifs
- Utilisez `--filter` pour cibler des packages spécifiques
- `--force` pour ignorer le cache si besoin

---

### 2. **npm workspaces** (Package Management)

**Description** : Gestion des packages dans le monorepo

**Commandes principales** :

```bash
# Installation
npm install                    # Installe toutes les dépendances
npm install --workspace=frontend package-name
npm install -w frontend package-name  # Raccourci

# Scripts
npm run dev                    # Via Turborepo
npm run test --workspace=frontend
npm run build -w backend

# Nettoyage
rm -rf node_modules package-lock.json
npm install                    # Réinstallation complète
```

**Tips** :

- Toujours installer depuis la racine
- Utilisez `-w` pour cibler un workspace spécifique

---

### 3. **Vitest** (Testing Framework)

**Description** : Framework de test moderne pour TypeScript/JavaScript

**Commandes principales** :

```bash
# Frontend
cd apps/frontend
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Avec couverture
npm run test:ui           # Interface graphique

# Backend
cd apps/backend
npm run test              # Tests unitaires
npm run test:e2e          # Tests E2E
npm run test:coverage     # Couverture

# Depuis la racine (via Turbo)
npm run test              # Tous les tests
npm run test:all          # Unit + E2E
```

**Configuration** :

- Frontend : `apps/frontend/vitest.config.ts`
- Backend : `apps/backend/vitest.config.ts` + `vitest.e2e.config.ts`

**Tips** :

- Utilisez `--filter` avec Turbo pour tester un seul package
- Watch mode pour développement TDD
- Coverage doit être >= 80%

---

### 4. **Playwright** (E2E Testing)

**Description** : Framework de test E2E pour applications web

**Commandes principales** :

```bash
cd apps/frontend

# Tests
npm run test:e2e              # Run E2E tests
npx playwright test           # Tests complets
npx playwright test --ui      # Mode UI
npx playwright test --debug   # Mode debug

# Browsers
npx playwright install        # Installer les navigateurs
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Génération de tests
npx playwright codegen http://localhost:3000
```

**Configuration** : `apps/frontend/playwright.config.ts`

**Tips** :

- UI mode pour développement interactif
- Codegen pour générer des tests automatiquement
- Debug mode pour inspecter les tests qui échouent

---

### 5. **Prisma** (ORM)

**Description** : ORM moderne pour PostgreSQL

**Commandes principales** :

```bash
cd apps/backend

# Migrations
npx prisma migrate dev --name migration_name  # Dev migration
npx prisma migrate deploy                     # Production
npx prisma migrate reset                      # Reset DB

# Génération
npx prisma generate          # Générer le client Prisma

# Studio
npx prisma studio            # Interface graphique DB

# Seed
npx prisma db seed           # Populate DB

# Introspection
npx prisma db pull           # Import schéma depuis DB existante
npx prisma db push           # Push schéma sans migration
```

**Configuration** : `apps/backend/prisma/schema.prisma`

**Tips** :

- Toujours run `generate` après une migration
- Utilisez `studio` pour visualiser les données
- `db push` pour prototypage rapide (dev only)

---

### 6. **ESLint** (Linting)

**Description** : Analyseur statique de code

**Commandes principales** :

```bash
# Depuis la racine
npm run lint              # Lint tout le monorepo
npm run lint:fix          # Lint + auto-fix

# Par workspace
npm run lint -w frontend
npm run lint -w backend

# Fichiers spécifiques
npx eslint apps/frontend/src/**/*.tsx
npx eslint apps/backend/src/**/*.ts --fix
```

**Configuration** :

- Shared config : `packages/eslint-config/`
- Frontend : `apps/frontend/eslint.config.mjs`
- Backend : `apps/backend/.eslintrc.js`

**Tips** :

- Lint-staged s'exécute automatiquement au commit
- `--fix` pour corrections automatiques
- Désactiver une règle : `// eslint-disable-next-line`

---

### 7. **Prettier** (Code Formatting)

**Description** : Formateur de code opinionated

**Commandes principales** :

```bash
# Depuis la racine
npm run format              # Format tout
npm run format:check        # Vérifier sans modifier

# Fichiers spécifiques
npx prettier --write "apps/frontend/src/**/*.{ts,tsx}"
npx prettier --check "apps/backend/src/**/*.ts"
```

**Configuration** : `.prettierrc` (racine)

**Tips** :

- Prettier s'exécute automatiquement au commit (lint-staged)
- Utilisez l'extension VSCode pour format on save
- `.prettierignore` pour exclure des fichiers

---

### 8. **Husky** (Git Hooks)

**Description** : Gestionnaire de hooks Git

**Hooks actifs** :

```bash
# Pre-commit (.husky/pre-commit)
npx lint-staged  # Lint + format sur fichiers staged

# Commit-msg (.husky/commit-msg)
npx commitlint --edit $1  # Valide le message de commit
```

**Commandes principales** :

```bash
# Installation
npx husky init

# Ajouter un hook
echo "npm test" > .husky/pre-push
chmod +x .husky/pre-push

# Désactiver temporairement
git commit -m "message" --no-verify
```

**Configuration** : `.husky/` directory

**Tips** :

- `--no-verify` pour skip les hooks (à éviter)
- Les hooks garantissent la qualité du code

---

### 9. **Commitlint** (Commit Messages)

**Description** : Validation des messages de commit

**Format Conventional Commits** :

```
type(scope): subject

body (optionnel)

footer (optionnel)
```

**Types valides** :

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactoring
- `perf`: Amélioration de performance
- `test`: Ajout/modification de tests
- `build`: Système de build (webpack, npm, etc.)
- `ci`: CI/CD
- `chore`: Maintenance (deps, config, etc.)
- `revert`: Revert d'un commit précédent

**Exemples** :

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update README with setup instructions"
git commit -m "test: add unit tests for auth service"
```

**Configuration** : `commitlint.config.js`

---

### 10. **SonarQube** (Code Quality)

**Description** : Plateforme d'analyse de qualité du code

**Configuration** : `sonar-project.properties`

**Métriques analysées** :

- Code coverage (>= 80%)
- Code smells
- Bugs potentiels
- Vulnerabilités de sécurité
- Duplication de code
- Complexité cyclomatique

**Intégration** : Via GitHub Actions CI

---

## 📦 Scripts npm Personnalisés

### Racine du Monorepo

```bash
# Qualité
npm run quality              # Lint + format + tests + coverage
npm run quality:fix          # Lint fix + format

# Tests
npm run test                 # Tests unitaires (tous)
npm run test:all             # Unit + E2E
npm run test:coverage        # Avec couverture

# Développement
npm run dev                  # Lance tous les projets
npm run build                # Build tous les projets

# Nettoyage
npm run clean                # Nettoie les artifacts
```

### Frontend (apps/frontend)

```bash
# Développement
npm run dev                  # Dev server (port 3000)
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # Lint
npm run format               # Format

# Tests
npm run test                 # Unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Avec couverture
npm run test:e2e             # E2E Playwright

# Prisma (auth only)
npm run prisma:generate      # Générer client
```

### Backend (apps/backend)

```bash
# Développement
npm run dev                  # Dev server (port 3001)
npm run build                # Build
npm run start                # Start production
npm run start:dev            # Dev avec watch
npm run start:debug          # Debug mode
npm run lint                 # Lint
npm run format               # Format

# Tests
npm run test                 # Unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Couverture
npm run test:e2e             # E2E tests

# Prisma
npm run prisma:generate      # Générer client
npm run prisma:migrate       # Run migrations
npm run prisma:studio        # Prisma Studio
```

---

## 🔧 Outils CLI Utiles

### 1. **grep / rg (ripgrep)** - Recherche de texte

```bash
# Rechercher dans le code
grep -r "searchTerm" apps/frontend/src/
rg "searchTerm" --type ts

# Rechercher avec contexte
grep -A 5 -B 5 "searchTerm" file.ts
rg "searchTerm" -A 5 -B 5

# Case insensitive
grep -ri "searchterm" .
rg -i "searchterm"
```

### 2. **find** - Recherche de fichiers

```bash
# Trouver des fichiers par nom
find apps/ -name "*.test.tsx"
find . -name "auth*"

# Trouver et exécuter
find apps/frontend/src -name "*.tsx" -exec wc -l {} \;

# Exclure node_modules
find . -name "*.ts" -not -path "*/node_modules/*"
```

### 3. **tree** - Visualiser l'arborescence

```bash
# Structure du projet
tree -L 3 -I "node_modules"

# Avec fichiers cachés
tree -a -L 2

# Uniquement les dossiers
tree -d -L 3
```

### 4. **git** - Gestion de version

```bash
# Status détaillé
git status -vv

# Log formaté
git log --oneline --graph --all
git log --pretty=format:"%h - %an, %ar : %s"

# Diff
git diff                    # Working tree vs staging
git diff --staged           # Staging vs last commit
git diff HEAD~1 HEAD        # Dernier commit

# Branches
git branch -a               # Toutes les branches
git checkout -b new-branch  # Créer et switch
git branch -d old-branch    # Supprimer

# Stash
git stash                   # Sauvegarder les changements
git stash pop               # Restaurer
git stash list              # Liste des stashes
```

### 5. **curl** - Tests API

```bash
# GET
curl http://localhost:3001/api/users

# POST avec JSON
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Avec authentification
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/protected

# Verbose mode
curl -v http://localhost:3001/api/health
```

### 6. **jq** - Parser JSON

```bash
# Formatter du JSON
curl http://localhost:3001/api/users | jq

# Extraire un champ
curl http://localhost:3001/api/users | jq '.data[0].email'

# Filtrer
curl http://localhost:3001/api/users | jq '.data[] | select(.role == "CREATOR")'
```

---

## 🎯 Outils Claude Code

### Commandes de recherche optimisées

```bash
# Glob (recherche de fichiers)
# Pattern matching rapide
**/*.test.tsx              # Tous les fichiers de test
apps/frontend/src/**/*.ts  # Tous les TS dans frontend

# Grep (recherche dans le contenu)
# Patterns regex
"function.*Auth"           # Fonctions contenant Auth
"interface.*Props"         # Interfaces Props
```

### Agents disponibles

Voir `/.claude/AGENTS.md` pour la liste complète

**Agents principaux** :

- `general-purpose` : Recherche multi-fichiers complexe
- `test-runner` : Exécution automatique de tests
- `code-reviewer` : Revue de code automatique

---

## 📚 Ressources

- **Turborepo Docs** : https://turborepo.com/docs
- **Vitest Docs** : https://vitest.dev/
- **Playwright Docs** : https://playwright.dev/
- **Prisma Docs** : https://www.prisma.io/docs
- **Conventional Commits** : https://www.conventionalcommits.org/

---

## 🔍 Matrice de Décision : Quel Outil Utiliser ?

| Tâche               | Outil         | Commande                     |
| ------------------- | ------------- | ---------------------------- |
| Développement local | Turborepo     | `npm run dev`                |
| Tests unitaires     | Vitest        | `npm run test`               |
| Tests E2E           | Playwright    | `npm run test:e2e`           |
| Migration DB        | Prisma        | `npx prisma migrate dev`     |
| Lint code           | ESLint        | `npm run lint`               |
| Format code         | Prettier      | `npm run format`             |
| Valider commit      | Commitlint    | Automatique (hook)           |
| Recherche fichier   | find/glob     | `find . -name "*.ts"`        |
| Recherche contenu   | grep/rg       | `grep -r "term"`             |
| Test API            | curl          | `curl http://localhost:3001` |
| Visualiser DB       | Prisma Studio | `npx prisma studio`          |

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-16
