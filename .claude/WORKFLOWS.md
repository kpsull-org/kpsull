# Workflows de Développement KpSull

> **But** : Processus standardisés et optimisés pour les tâches courantes de développement.

## 🎯 Workflows Principaux

### 1. 🆕 Nouvelle Fonctionnalité (TDD)

**Approche** : Test-Driven Development (Red-Green-Refactor)

```bash
# Étape 1: RED - Écrire le test qui échoue
# Créer le fichier de test
touch apps/frontend/src/components/NewFeature.test.tsx

# Écrire le test
# describe('NewFeature', () => {
#   it('should do something', () => {
#     expect(result).toBe(expected)
#   })
# })

# Exécuter le test (doit échouer)
npm run test --filter=frontend

# Étape 2: GREEN - Écrire le code minimal
touch apps/frontend/src/components/NewFeature.tsx
# Implémenter la fonctionnalité minimale

# Exécuter le test (doit passer)
npm run test --filter=frontend

# Étape 3: REFACTOR - Améliorer le code
# Refactorer en gardant les tests verts
# Vérifier SOLID principles

# Étape 4: Coverage
npm run test:coverage --filter=frontend
# Vérifier que coverage >= 80%

# Étape 5: Commit
git add .
git commit -m "feat: add new feature with tests"
# Pre-commit hook exécute lint-staged
# Commit-msg hook valide le message
```

**Temps estimé** : 30-60 minutes selon complexité

---

### 2. 🐛 Correction de Bug

```bash
# Étape 1: Reproduire le bug avec un test
touch apps/frontend/src/components/BuggyComponent.test.tsx
# Écrire un test qui expose le bug (doit échouer)

# Étape 2: Exécuter le test
npm run test --filter=frontend
# Confirmer que le test échoue

# Étape 3: Corriger le bug
# Modifier le code pour corriger le problème

# Étape 4: Vérifier le test
npm run test --filter=frontend
# Le test doit maintenant passer

# Étape 5: Tests de régression
npm run test:all
# S'assurer qu'aucun autre test n'est cassé

# Étape 6: Commit
git add .
git commit -m "fix: resolve issue with component behavior"
```

**Temps estimé** : 15-45 minutes

---

### 3. 🎨 Nouveau Composant UI (React + shadcn/ui)

```bash
# Étape 1: RED - Créer les tests
touch apps/frontend/src/components/ui/my-component.test.tsx

# Écrire les tests pour toutes les variantes
# - Props basiques
# - Variantes (size, variant, etc.)
# - Events (onClick, onChange, etc.)
# - États (disabled, loading, etc.)

# Étape 2: GREEN - Créer le composant
touch apps/frontend/src/components/ui/my-component.tsx

cat > apps/frontend/src/components/ui/my-component.tsx << 'EOF'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const myComponentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "variant-classes",
        secondary: "variant-classes",
      },
      size: {
        default: "size-classes",
        sm: "size-classes",
        lg: "size-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(myComponentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent, myComponentVariants }
EOF

# Étape 3: Tests
npm run test --filter=frontend

# Étape 4: Storybook (optionnel)
# Créer une story si Storybook est configuré

# Étape 5: Commit
git add .
git commit -m "feat(ui): add MyComponent with variants"
```

**Temps estimé** : 45-90 minutes

---

### 4. 🔌 Nouveau Endpoint API (NestJS)

```bash
# Étape 1: Générer le module
cd apps/backend
npx nest g module my-resource
npx nest g controller my-resource
npx nest g service my-resource

# Étape 2: RED - Créer les tests E2E
touch test/my-resource.e2e-spec.ts

cat > test/my-resource.e2e-spec.ts << 'EOF'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module'

describe('MyResource E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('/my-resource (GET)', () => {
    return request(app.getHttpServer())
      .get('/my-resource')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data')
      })
  })
})
EOF

# Étape 3: GREEN - Implémenter le controller
# Éditer src/my-resource/my-resource.controller.ts

# Étape 4: GREEN - Implémenter le service
# Éditer src/my-resource/my-resource.service.ts

# Étape 5: Tests
npm run test:e2e

# Étape 6: Vérifier la couverture
npm run test:coverage

# Étape 7: Commit
cd ../..
git add .
git commit -m "feat(api): add my-resource endpoint"
```

**Temps estimé** : 60-120 minutes

---

### 5. 🗄️ Migration Base de Données (Prisma)

```bash
# Étape 1: Modifier le schéma
cd apps/backend
# Éditer prisma/schema.prisma

# Étape 2: Créer la migration
npx prisma migrate dev --name add_new_field

# Étape 3: Générer le client Prisma
npx prisma generate

# Étape 4: Mettre à jour les types TypeScript
# Vérifier que les types sont à jour dans les services

# Étape 5: Tests
npm run test
npm run test:e2e

# Étape 6: Commit (inclure le schéma ET la migration)
cd ../..
git add apps/backend/prisma/
git commit -m "feat(db): add new field to User model"
```

**Temps estimé** : 15-30 minutes

---

### 6. 📦 Ajout de Dépendance

```bash
# Étape 1: Vérifier la compatibilité
npm outdated

# Étape 2: Installer la dépendance
cd apps/frontend  # ou apps/backend
npm install package-name

# Étape 3: Vérifier les types
npm install -D @types/package-name  # si nécessaire

# Étape 4: Tests
cd ../..
npm run test:all

# Étape 5: Build
npm run build

# Étape 6: Commit
git add .
git commit -m "chore: add package-name dependency"
```

**Temps estimé** : 10-20 minutes

---

### 7. 🔍 Revue de Code Avant Commit

```bash
# Étape 1: Status Git
git status

# Étape 2: Diff
git diff

# Étape 3: Lint
npm run lint

# Étape 4: Format Check
npm run format:check

# Étape 5: Tests
npm run test:all

# Étape 6: Coverage
npm run test:coverage

# Étape 7: Build (optionnel)
npm run build

# Étape 8: Commit
git add .
git commit -m "type: description"
# Hooks automatiques : lint-staged + commitlint
```

**Temps estimé** : 5-10 minutes

---

### 8. 🚀 Déploiement / Release

```bash
# Étape 1: Pull latest
git checkout main
git pull origin main

# Étape 2: Vérifier l'état
git status
# S'assurer que tout est propre

# Étape 3: Tests complets
npm run test:all

# Étape 4: Build
npm run build

# Étape 5: Tag de version
# Suivre semantic versioning (MAJOR.MINOR.PATCH)
git tag v1.2.3
git push origin v1.2.3

# Étape 6: CI/CD
# GitHub Actions va automatiquement déployer

# Étape 7: Vérifier le déploiement
# Tester l'app en production
```

**Temps estimé** : 20-40 minutes

---

## 🔄 Workflows Automatisés

### Pre-commit Hook (Husky)

**Déclenché** : Avant chaque commit

**Actions** :

1. Lint-staged exécute Prettier sur les fichiers modifiés
2. Prettier reformate automatiquement le code
3. Le commit échoue si des erreurs persistent

**Fichier** : `.husky/pre-commit`

---

### Commit-msg Hook (Commitlint)

**Déclenché** : Après `git commit -m "..."`

**Actions** :

1. Valide le format du message (Conventional Commits)
2. Vérifie le type (feat, fix, docs, etc.)
3. Vérifie la longueur des lignes (< 100 caractères)

**Fichier** : `.husky/commit-msg`

---

### CI Pipeline (GitHub Actions)

**Déclenché** : Sur push ou pull request

**Actions** :

1. Install dependencies
2. Run linters (ESLint, Prettier)
3. Run tests (unit + E2E)
4. Generate coverage report
5. Upload artifacts
6. SonarQube analysis

**Fichier** : `.github/workflows/ci.yml`

---

## 📋 Checklists Rapides

### ✅ Checklist Feature Complète

- [ ] Tests écrits en premier (RED)
- [ ] Code implémenté (GREEN)
- [ ] Code refactoré (REFACTOR)
- [ ] Couverture >= 80%
- [ ] SOLID principles respectés
- [ ] Lint passing
- [ ] Format checking passing
- [ ] Build successful
- [ ] Commit avec message conventionnel

### ✅ Checklist Bug Fix

- [ ] Test de reproduction créé
- [ ] Test échoue avant le fix
- [ ] Bug corrigé
- [ ] Test passe après le fix
- [ ] Tests de régression OK
- [ ] Commit avec message "fix:"

### ✅ Checklist Pull Request

- [ ] Branch à jour avec main
- [ ] Tous les tests passent
- [ ] Coverage >= 80%
- [ ] Build successful
- [ ] Pas de conflits
- [ ] Description claire du PR
- [ ] Reviewers assignés

---

## 🎯 Workflows par Rôle

### Frontend Developer

**Workflow quotidien** :

1. Nouvelle fonctionnalité → Workflow #1 (TDD)
2. Nouveau composant → Workflow #3
3. Fix bug → Workflow #2
4. Revue code → Workflow #7

### Backend Developer

**Workflow quotidien** :

1. Nouveau endpoint → Workflow #4
2. Migration DB → Workflow #5
3. Fix bug → Workflow #2
4. Revue code → Workflow #7

### Full-Stack Developer

**Workflow quotidien** :
Combinaison de tous les workflows ci-dessus

---

## 🚦 État des Workflows

| Workflow          | Statut | Automatisé            | Documentation |
| ----------------- | ------ | --------------------- | ------------- |
| TDD Feature       | ✅     | Partiellement (hooks) | Complet       |
| Bug Fix           | ✅     | Partiellement (hooks) | Complet       |
| Nouveau Composant | ✅     | Non                   | Complet       |
| Nouveau Endpoint  | ✅     | Non                   | Complet       |
| Migration DB      | ✅     | Non                   | Complet       |
| Ajout Dépendance  | ✅     | Non                   | Complet       |
| Revue Code        | ✅     | Oui (CI)              | Complet       |
| Déploiement       | ✅     | Oui (CI/CD)           | Complet       |

---

## 📚 Ressources

- **SOLID Principles** : `/CLAUDE.md`
- **TDD Methodology** : `/CLAUDE.md`
- **Agents disponibles** : `/.claude/AGENTS.md`
- **Outils** : `/.claude/TOOLS.md`
- **Guide contexte** : `/.claude/CONTEXT_GUIDE.md`

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-16
