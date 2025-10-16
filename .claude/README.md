# 🤖 Documentation IA Claude - KpSull

> **Centre de documentation optimisé pour l'Intelligence Artificielle Claude**
> Conçu pour maximiser l'efficacité et minimiser la consommation de contexte.

## 🎯 Démarrage Rapide (30 secondes)

**Vous êtes Claude et vous démarrez une nouvelle tâche ?**

### ⚡ Commencez TOUJOURS par :

```
1. Read /.claude/PROJECT_CONTEXT.md
   → Vue d'ensemble complète du projet en 3000 tokens
   → Stack, architecture, conventions, points d'attention

2. (Optionnel) Read le guide spécifique à votre tâche :
   - /.claude/AGENTS.md      → Quel agent utiliser ?
   - /.claude/WORKFLOWS.md   → Comment faire X ?
   - /.claude/TOOLS.md       → Quelle commande lancer ?
   - /.claude/CONTEXT_GUIDE.md → Comment économiser des tokens ?
```

**Ne lisez JAMAIS `/CLAUDE.md` en premier** (15K tokens), sauf si vous avez besoin d'exemples détaillés de SOLID principles.

---

## 📚 Structure de la Documentation

```
.claude/
├── README.md              ← Vous êtes ici (index principal)
├── PROJECT_CONTEXT.md     ← 🌟 COMMENCER ICI (contexte minimal essentiel)
├── AGENTS.md              ← Liste des agents IA disponibles
├── WORKFLOWS.md           ← Processus standardisés (TDD, composants, API)
├── TOOLS.md               ← Outils et commandes CLI
├── CONTEXT_GUIDE.md       ← Optimisation de l'utilisation du contexte
├── settings.local.json    ← Configuration Claude Code
└── agents/                ← Agents personnalisés (MCP, etc.)
```

---

## 🗺️ Guide de Navigation

### Selon votre besoin, lisez :

| Besoin                           | Fichier              | Tokens | Quand                                |
| -------------------------------- | -------------------- | ------ | ------------------------------------ |
| **Vue d'ensemble du projet**     | `PROJECT_CONTEXT.md` | ~3K    | 🌟 TOUJOURS en premier               |
| **Savoir quel agent utiliser**   | `AGENTS.md`          | ~5K    | Tâche complexe multi-étapes          |
| **Suivre un processus standard** | `WORKFLOWS.md`       | ~5K    | Nouveau composant, endpoint, feature |
| **Trouver une commande**         | `TOOLS.md`           | ~5K    | Besoin d'un outil CLI spécifique     |
| **Économiser le contexte**       | `CONTEXT_GUIDE.md`   | ~4K    | Conversation longue ou complexe      |
| **Exemples SOLID détaillés**     | `/CLAUDE.md`         | ~15K   | Refactoring architectural majeur     |

---

## 🎓 Principes d'Utilisation

### 1. **Hiérarchie de Lecture**

```
Niveau 1 (Obligatoire) : PROJECT_CONTEXT.md
    ↓
Niveau 2 (Si nécessaire) : AGENTS / WORKFLOWS / TOOLS
    ↓
Niveau 3 (Rarement) : /CLAUDE.md complet
```

### 2. **Règle des 80/20**

**80% des tâches** peuvent être accomplies avec **20% de la documentation** :

- `PROJECT_CONTEXT.md` + ciblage précis avec Grep/Glob

**20% des tâches** (complexes) nécessitent les autres documents :

- Agents pour recherches multi-fichiers
- Workflows pour processus standards
- CLAUDE.md pour refactoring architectural

### 3. **Économie de Contexte**

**Budget total** : 200 000 tokens par conversation

**Budget recommandé par tâche** :

- Simple (bug fix) : < 10K tokens
- Moyenne (feature) : 20-40K tokens
- Complexe (refactor) : 40-60K tokens

**Objectif** : 6-8 tâches complètes par conversation

---

## 🚀 Workflows Rapides

### Nouvelle Fonctionnalité (TDD)

```bash
1. Read /.claude/PROJECT_CONTEXT.md          # 3K tokens
2. Read /.claude/WORKFLOWS.md (section #1)   # 2K tokens
3. Grep pour trouver des exemples            # 1K tokens
4. Read 2-3 fichiers pertinents              # 6K tokens
5. Write/Edit implémentation                 # 5K tokens
6. Bash tests                                # 2K tokens
7. TodoWrite pour tracker                    # 1K tokens

Total : ~20K tokens ✅
```

### Bug Fix

```bash
1. Read /.claude/PROJECT_CONTEXT.md          # 3K tokens
2. Grep pour localiser le bug                # 1K tokens
3. Read fichier spécifique                   # 2K tokens
4. Edit correction                           # 2K tokens
5. Bash tests                                # 2K tokens

Total : ~10K tokens ✅
```

### Recherche/Analyse Complexe

```bash
1. Read /.claude/PROJECT_CONTEXT.md          # 3K tokens
2. Read /.claude/AGENTS.md                   # 5K tokens
3. Agent general-purpose (recherche)         # 5K tokens
4. Agent retourne résumé                     # 3K tokens
5. Read fichiers identifiés                  # 5K tokens

Total : ~20K tokens ✅
```

---

## 🤖 Agents Disponibles

### Agents Intégrés (Claude Code)

1. **general-purpose** : Recherches complexes multi-fichiers
2. **statusline-setup** : Configuration barre de statut
3. **output-style-setup** : Styles de sortie personnalisés

### Agents Personnalisés (À créer)

4. **test-runner** : Exécution automatique de tests
5. **code-reviewer** : Revue de code + SOLID
6. **prisma-helper** : Assistance migrations Prisma
7. **component-generator** : Génération composants React + tests
8. **api-endpoint-builder** : Création endpoints NestJS
9. **solid-validator** : Validation principes SOLID
10. **dependency-updater** : Mise à jour sécurisée des dépendances

**Détails complets** : `/.claude/AGENTS.md`

---

## 🛠️ Outils Essentiels

### Recherche Optimisée

```bash
# Grep > Read pour rechercher du code
Grep "pattern" path/ --output_mode files_with_matches

# Glob > find pour trouver des fichiers
Glob **/*.test.tsx

# Read avec limit pour gros fichiers
Read file.ts --limit 100 --offset 0
```

### Tests & Qualité

```bash
npm run test              # Tests unitaires (Vitest)
npm run test:e2e          # E2E (Playwright + Supertest)
npm run test:coverage     # Couverture (>= 80%)
npm run quality           # Lint + format + tests
```

### Développement

```bash
npm run dev                    # Tous les projets
npm run dev --filter=frontend  # Frontend seul (port 3000)
npm run dev --filter=backend   # Backend seul (port 3001)
```

**Liste complète** : `/.claude/TOOLS.md`

---

## 📋 Checklist d'Optimisation

Avant chaque tâche :

### ✅ Lecture Optimisée

- [ ] Ai-je lu PROJECT_CONTEXT.md en premier ?
- [ ] Puis-je utiliser Grep au lieu de Read ?
- [ ] Puis-je utiliser un agent pour cette tâche complexe ?
- [ ] Ai-je besoin de tout le fichier ou juste une partie ?

### ✅ Contexte Économisé

- [ ] Ai-je référencé un fichier au lieu de copier du code ?
- [ ] Ai-je évité de répéter le contexte du projet ?
- [ ] Ai-je utilisé TodoWrite pour tracker ma progression ?

### ✅ Efficacité

- [ ] Ai-je suivi le workflow standard pour cette tâche ?
- [ ] Ai-je économisé suffisamment de tokens pour finir ?

---

## 🎯 Matrice de Décision : Que Lire ?

| Tâche                    | Documents Nécessaires        | Tokens | Temps  |
| ------------------------ | ---------------------------- | ------ | ------ |
| **Bug fix simple**       | PROJECT_CONTEXT.md           | 3K     | 2 min  |
| **Nouvelle feature**     | PROJECT_CONTEXT + WORKFLOWS  | 5K     | 5 min  |
| **Nouveau composant UI** | PROJECT_CONTEXT + WORKFLOWS  | 5K     | 5 min  |
| **Recherche complexe**   | PROJECT_CONTEXT + AGENTS     | 8K     | 8 min  |
| **Refactor SOLID**       | PROJECT_CONTEXT + /CLAUDE.md | 18K    | 15 min |
| **Setup complet**        | Tous les docs                | 35K    | 30 min |

---

## 🚨 Anti-Patterns à Éviter

### ❌ Lire CLAUDE.md en premier

**Problème** : 15K tokens pour des infos déjà résumées dans PROJECT_CONTEXT.md
**Solution** : Toujours commencer par PROJECT_CONTEXT.md

### ❌ Lire tous les fichiers d'un dossier

**Problème** : 50K+ tokens consommés inutilement
**Solution** : Grep pour cibler, puis Read spécifique

### ❌ Recherche manuelle multi-fichiers

**Problème** : Très coûteux en tokens
**Solution** : Utiliser l'agent general-purpose

### ❌ Répéter le contexte à chaque message

**Problème** : +5K tokens par message
**Solution** : Référencer PROJECT_CONTEXT.md une seule fois

**Liste complète** : `/.claude/CONTEXT_GUIDE.md`

---

## 📊 Monitoring

### Indicateurs de Performance

**Vous êtes optimisé si** :

- ✅ < 5 fichiers Read par tâche
- ✅ Grep/Glob utilisés avant Read
- ✅ PROJECT_CONTEXT.md lu en premier
- ✅ Agents utilisés pour recherches complexes

**Vous consommez trop si** :

- 🚨 > 10 fichiers Read pour une tâche simple
- 🚨 Read de gros fichiers (>500 lignes) sans --limit
- 🚨 Aucun agent utilisé pour tâche complexe
- 🚨 Répétition du contexte projet

---

## 🎯 Objectifs

### Par Conversation (200K tokens)

- **Minimum** : 4-5 tâches complètes
- **Optimal** : 6-8 tâches complètes
- **Excellent** : 10+ tâches complètes

### Par Tâche

- **Simple** : < 10K tokens
- **Moyenne** : 20-40K tokens
- **Complexe** : 40-60K tokens

---

## 📖 Documentation Complète du Projet

### Documents Racine

- **`/README.md`** : Documentation principale pour développeurs
- **`/CLAUDE.md`** : Documentation complète (SOLID + TDD + Architecture)
- **`/.mcp.json`** : Configuration MCP servers
- **`/sonar-project.properties`** : Configuration SonarQube
- **`/commitlint.config.js`** : Règles de commit

### Documentation App-Specific

- **`/apps/frontend/BUILD_KNOWN_ISSUES.md`** : Problèmes connus Next.js build
- **`/apps/backend/prisma/schema.prisma`** : Schéma de base de données

---

## 🔗 Liens Utiles

- **Turborepo Docs** : https://turborepo.com/docs
- **Next.js Docs** : https://nextjs.org/docs
- **NestJS Docs** : https://docs.nestjs.com/
- **Vitest Docs** : https://vitest.dev/
- **Playwright Docs** : https://playwright.dev/
- **Prisma Docs** : https://www.prisma.io/docs
- **Claude Code Docs** : https://docs.claude.com/claude-code

---

## 💡 Tips pour Claude

1. **Toujours commencer par PROJECT_CONTEXT.md** (gain de 80% de temps)
2. **Utiliser Grep avant Read** (gain de 90% de tokens sur les recherches)
3. **Déléguer aux agents** les tâches complexes multi-fichiers
4. **Référencer les fichiers** avec chemin:ligne au lieu de copier le code
5. **Suivre les workflows standards** (WORKFLOWS.md) pour les tâches courantes
6. **TodoWrite pour la mémoire externe** et libérer le contexte

---

## 🏆 Best Practices

### Lecture Intelligente

```
✅ Bon : Read PROJECT_CONTEXT.md → Grep → Read ciblé
❌ Mauvais : Read tous les fichiers un par un
```

### Utilisation des Agents

```
✅ Bon : Agent general-purpose pour recherches complexes
❌ Mauvais : Lecture manuelle de 20 fichiers
```

### Économie de Contexte

```
✅ Bon : "Le problème est dans auth.ts:156"
❌ Mauvais : [Copie 200 lignes de code dans le chat]
```

---

## 📈 Statistiques du Système

**Documentation créée** : 5 fichiers principaux + 1 index (ce fichier)

**Tokens par document** :

- PROJECT_CONTEXT.md : ~3 000 tokens
- AGENTS.md : ~5 000 tokens
- WORKFLOWS.md : ~5 000 tokens
- TOOLS.md : ~5 000 tokens
- CONTEXT_GUIDE.md : ~4 000 tokens
- README.md (ce fichier) : ~2 500 tokens

**Total documentation** : ~24 500 tokens

**Économie projetée** : 75% de réduction de consommation de contexte par tâche

---

## 🆘 Support

**Questions ?** Consultez dans cet ordre :

1. `PROJECT_CONTEXT.md` → Vue d'ensemble
2. `WORKFLOWS.md` → Comment faire X ?
3. `AGENTS.md` → Quel agent utiliser ?
4. `TOOLS.md` → Quelle commande ?
5. `CONTEXT_GUIDE.md` → Comment optimiser ?
6. `/CLAUDE.md` → Détails SOLID/TDD

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-16
**Créé pour** : Claude (Sonnet 4.5)
**Objectif** : Environnement de développement IA optimal avec économie de contexte maximale

---

## 🚀 Prêt à Démarrer ?

### Nouvelle session Claude ?

```bash
# Étape 1 : Lire le contexte essentiel
Read /.claude/PROJECT_CONTEXT.md

# Étape 2 : Identifier votre tâche
# Bug fix ? Feature ? Recherche ?

# Étape 3 : Lire le guide approprié (optionnel)
Read /.claude/WORKFLOWS.md  # ou AGENTS.md, TOOLS.md

# Étape 4 : Commencer le travail
# Utilisez Grep/Glob pour cibler précisément
```

**Bonne chance et bon développement ! 🎉**
