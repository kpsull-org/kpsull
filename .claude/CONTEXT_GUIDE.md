# Guide d'Optimisation du Contexte pour Claude

> **But** : Maximiser l'efficacité de Claude tout en minimisant la consommation de tokens pour économiser le contexte conversationnel.

## 🎯 Principes Fondamentaux

### 1. **Lire intelligemment, pas exhaustivement**

❌ **Mauvaise approche** : Lire tous les fichiers d'un dossier

```
Read apps/frontend/src/components/ui/button.tsx
Read apps/frontend/src/components/ui/card.tsx
Read apps/frontend/src/components/ui/input.tsx
... (20 fichiers)
```

**Coût** : ~50 000 tokens

✅ **Bonne approche** : Utiliser Grep pour cibler

```
Grep "export.*Button" apps/frontend/src/components/ui/
```

**Coût** : ~500 tokens

### 2. **Utiliser les agents pour les tâches complexes**

❌ **Mauvaise approche** : Recherche manuelle multi-fichiers

```
Read file1.ts → analyser → Read file2.ts → analyser → ...
```

**Coût** : Très élevé + risque de perdre le contexte

✅ **Bonne approche** : Déléguer à un agent

```
Agent general-purpose: "Recherche toutes les implémentations
d'authentification et résume-les"
```

**Coût** : L'agent travaille en autonome et retourne uniquement le résumé

### 3. **Référencer plutôt que répéter**

❌ **Mauvaise approche** : Copier-coller du code dans la conversation

```
User: "Voici mon composant Button: [200 lignes de code]
Peux-tu l'améliorer?"
```

✅ **Bonne approche** : Référencer le fichier

```
User: "Améliore apps/frontend/src/components/ui/button.tsx"
Claude: [lit uniquement ce fichier]
```

---

## 📊 Hiérarchie de Lecture (Ordre de Priorité)

### Niveau 1 : Contexte Minimal (À lire en PREMIER)

**Fichier unique** : `/.claude/PROJECT_CONTEXT.md`

**Contenu** :

- Vue d'ensemble du projet (30 secondes)
- Stack technique (table compacte)
- Structure monorepo
- Conventions de code
- Points d'attention

**Tokens** : ~3 000

**Quand** : Au début de CHAQUE nouvelle tâche

---

### Niveau 2 : Contexte Spécialisé (Si nécessaire)

**Fichiers** :

- `/.claude/AGENTS.md` → Pour savoir quel agent utiliser
- `/.claude/WORKFLOWS.md` → Pour suivre un processus standard
- `/.claude/TOOLS.md` → Pour connaître les commandes disponibles

**Tokens** : ~5 000 chacun

**Quand** :

- AGENTS.md : Tâche complexe multi-étapes
- WORKFLOWS.md : Processus répétitif (nouveau composant, endpoint, etc.)
- TOOLS.md : Besoin d'une commande spécifique

---

### Niveau 3 : Contexte Détaillé (Rarement nécessaire)

**Fichiers** :

- `/CLAUDE.md` → SOLID principles détaillés + TDD
- `/README.md` → Documentation complète du projet

**Tokens** : ~15 000 pour CLAUDE.md

**Quand** :

- Besoin d'exemples concrets de SOLID
- Refactoring architectural majeur
- Formation d'un nouveau développeur

---

## 🔍 Stratégies de Recherche Optimisées

### 1. **Grep > Read pour la recherche**

**Scénario** : "Où est définie la fonction `getUserById` ?"

❌ Mauvais :

```
Read apps/backend/src/users/users.service.ts
Read apps/backend/src/users/users.controller.ts
... (chercher manuellement)
```

✅ Bon :

```
Grep "getUserById" apps/backend/src/ --output_mode files_with_matches
→ Retourne uniquement les fichiers qui contiennent la fonction
→ Ensuite Read le fichier spécifique
```

**Économie** : 90% de tokens

---

### 2. **Glob pour trouver des fichiers**

**Scénario** : "Où sont tous les tests du projet ?"

❌ Mauvais :

```
Bash: find . -name "*.test.ts"
→ Retourne potentiellement du contenu inutile
```

✅ Bon :

```
Glob: **/*.test.{ts,tsx}
→ Pattern matching rapide et précis
```

**Économie** : 50% de tokens + plus rapide

---

### 3. **Read avec limit/offset pour les gros fichiers**

**Scénario** : Fichier de 1000 lignes

❌ Mauvais :

```
Read entire-file.ts
→ Charge 1000 lignes même si on ne regarde que le début
```

✅ Bon :

```
Read entire-file.ts --limit 100
→ Charge uniquement les 100 premières lignes
→ Ensuite Read avec --offset si besoin
```

**Économie** : 80% de tokens pour les gros fichiers

---

## 🧠 Gestion du Contexte dans une Conversation

### Phase 1 : Découverte (Tokens faibles)

**Objectif** : Comprendre le projet rapidement

```
1. Read /.claude/PROJECT_CONTEXT.md
2. Grep pour trouver les fichiers pertinents
3. Read uniquement les fichiers ciblés
```

**Budget** : ~5 000 tokens

---

### Phase 2 : Planification (Tokens moyens)

**Objectif** : Planifier l'implémentation

```
1. Read /.claude/WORKFLOWS.md (workflow spécifique)
2. TodoWrite pour créer un plan
3. Grep pour vérifier l'existant
```

**Budget** : ~10 000 tokens

---

### Phase 3 : Implémentation (Tokens moyens-élevés)

**Objectif** : Coder et tester

```
1. Read fichiers spécifiques à modifier
2. Write/Edit pour implémenter
3. Bash pour tester
4. TodoWrite pour tracker la progression
```

**Budget** : ~20 000 tokens

---

### Phase 4 : Validation (Tokens faibles)

**Objectif** : Vérifier la qualité

```
1. Bash: npm run test
2. Bash: npm run lint
3. Git commit
```

**Budget** : ~3 000 tokens

---

## 📈 Tableau de Coûts en Tokens (Estimations)

| Action                                 | Tokens Consommés | Alternative Optimisée   | Économie |
| -------------------------------------- | ---------------- | ----------------------- | -------- |
| Read 1 fichier TypeScript (200 lignes) | ~2 000           | Grep puis Read ciblé    | 50%      |
| Read 10 fichiers                       | ~20 000          | Agent general-purpose   | 80%      |
| Read CLAUDE.md complet                 | ~15 000          | Read PROJECT_CONTEXT.md | 80%      |
| Recherche manuelle dans 5 dossiers     | ~30 000          | Grep avec pattern       | 90%      |
| Bash find + cat plusieurs fichiers     | ~10 000          | Glob + Read ciblé       | 70%      |
| Répéter le contexte à chaque message   | +5 000/msg       | Référencer les fichiers | 90%      |

**Limite totale** : 200 000 tokens par conversation
**Budget recommandé par tâche** : 20 000 - 40 000 tokens

---

## 🎯 Stratégies par Type de Tâche

### 🆕 Nouvelle Fonctionnalité

**Budget** : 30 000 - 50 000 tokens

**Étapes optimisées** :

1. `Read /.claude/PROJECT_CONTEXT.md` (3K tokens)
2. `Read /.claude/WORKFLOWS.md` section TDD (2K tokens)
3. `Grep` pour trouver des exemples similaires (1K tokens)
4. `Read` 2-3 fichiers pertinents (6K tokens)
5. `Write/Edit` implémentation (5K tokens)
6. `Bash` tests (2K tokens)
7. `TodoWrite` pour tracker (1K tokens)

**Total** : ~20K tokens ✅

---

### 🐛 Bug Fix

**Budget** : 10 000 - 20 000 tokens

**Étapes optimisées** :

1. `Grep` pour trouver le code buggy (1K tokens)
2. `Read` fichier spécifique (2K tokens)
3. `Edit` correction (2K tokens)
4. `Bash` tests (2K tokens)

**Total** : ~7K tokens ✅

---

### 🔍 Recherche/Analyse

**Budget** : 15 000 - 30 000 tokens

**Étapes optimisées** :

1. `Agent general-purpose` pour recherche complexe (5K tokens)
2. Agent retourne un résumé (3K tokens)
3. `Read` fichiers identifiés (5K tokens)

**Total** : ~13K tokens ✅

---

### 📖 Documentation

**Budget** : 5 000 - 15 000 tokens

**Étapes optimisées** :

1. `Read PROJECT_CONTEXT.md` (3K tokens)
2. `Glob` pour trouver les fichiers à documenter (500 tokens)
3. `Grep` pour extraire les exports/types (1K tokens)
4. `Write` documentation (3K tokens)

**Total** : ~7.5K tokens ✅

---

## 🚨 Anti-Patterns à Éviter

### ❌ Anti-Pattern 1 : "Read Everything"

```
Read apps/frontend/src/app/page.tsx
Read apps/frontend/src/app/layout.tsx
Read apps/frontend/src/app/auth/login/page.tsx
... (lire tout le dossier app/)
```

**Problème** : Consomme 50 000+ tokens inutilement

**Solution** : Utiliser Glob pour lister, puis Read uniquement ce qui est nécessaire

---

### ❌ Anti-Pattern 2 : "Repetitive Context"

```
User: "Voici mon projet: [description longue]"
Claude: [répond]
User: "Rappel, mon projet c'est: [même description]"
```

**Problème** : Répète le contexte à chaque message

**Solution** : Référencer PROJECT_CONTEXT.md, Claude le lit une fois

---

### ❌ Anti-Pattern 3 : "Manual Multi-File Search"

```
Read file1.ts → pas trouvé
Read file2.ts → pas trouvé
Read file3.ts → trouvé!
```

**Problème** : Essai-erreur coûteux

**Solution** : Grep d'abord pour localiser, puis Read

---

### ❌ Anti-Pattern 4 : "Full File Read for Small Info"

```
Read 1000-line-file.ts
→ Juste pour vérifier une import
```

**Problème** : Charge un gros fichier pour une petite info

**Solution** : Grep avec pattern pour extraire uniquement l'info

---

### ❌ Anti-Pattern 5 : "Ignoring Agents"

```
User: "Analyse toute l'authentification du projet"
Claude: [lit manuellement 30 fichiers]
```

**Problème** : Tâche complexe faite manuellement

**Solution** : Déléguer à l'agent `general-purpose`

---

## 📋 Checklist d'Optimisation

Avant chaque tâche, posez-vous ces questions :

### ✅ Lecture Optimisée

- [ ] Ai-je d'abord lu PROJECT_CONTEXT.md ?
- [ ] Puis-je utiliser Grep au lieu de Read pour chercher ?
- [ ] Puis-je utiliser Glob pour trouver des fichiers ?
- [ ] Ai-je besoin de tout le fichier ou juste une partie ?
- [ ] Puis-je utiliser un agent pour cette recherche complexe ?

### ✅ Contexte Économisé

- [ ] Ai-je référencé un fichier au lieu de copier du code ?
- [ ] Ai-je évité de répéter le contexte du projet ?
- [ ] Ai-je utilisé TodoWrite pour éviter de perdre ma progression ?
- [ ] Ai-je lu uniquement la documentation nécessaire ?

### ✅ Efficacité

- [ ] Ai-je utilisé le workflow standard pour cette tâche ?
- [ ] Ai-je délégué les tâches complexes aux agents ?
- [ ] Ai-je utilisé les outils appropriés (voir TOOLS.md) ?
- [ ] Ai-je économisé suffisamment de tokens pour finir la tâche ?

---

## 💡 Tips Avancés

### 1. **Résumés intermédiaires**

Après avoir lu plusieurs fichiers, demandez un résumé :

```
Claude: "Résume les 3 fichiers que tu viens de lire en 5 bullet points"
```

**Bénéfice** : Contexte condensé pour la suite de la conversation

---

### 2. **TodoWrite comme mémoire externe**

Utilisez TodoWrite pour externaliser la mémoire :

```
TodoWrite:
- [ ] Fichier X utilise BetterAuth avec Google OAuth
- [ ] Fichier Y a un problème de type sur ligne 42
- [ ] Fichier Z est bien testé (couverture 95%)
```

**Bénéfice** : Libère le contexte conversationnel

---

### 3. **Référencement intelligent**

Au lieu de copier du code, référencez avec le numéro de ligne :

```
"Le problème est dans apps/frontend/src/lib/auth.ts:156"
```

**Bénéfice** : Claude peut cibler précisément sans relire tout le fichier

---

### 4. **Agents en cascade**

Chaînez les agents pour les tâches très complexes :

```
1. Agent general-purpose → Trouve tous les fichiers auth
2. Agent code-reviewer → Analyse la qualité
3. Agent solid-validator → Vérifie SOLID
```

**Bénéfice** : Chaque agent travaille indépendamment, contexte optimisé

---

## 🎓 Exemples Concrets

### Exemple 1 : "Ajouter l'authentification Apple"

**❌ Approche non optimisée** (80K tokens) :

1. Read CLAUDE.md complet → 15K
2. Read tous les fichiers auth frontend → 20K
3. Read tous les fichiers auth backend → 20K
4. Read documentation BetterAuth → 15K
5. Implémentation → 10K

**✅ Approche optimisée** (20K tokens) :

1. Read PROJECT_CONTEXT.md → 3K
2. Grep "OAuth.\*Google" apps/frontend/ → 1K
3. Read fichier trouvé → 2K
4. Read WORKFLOWS.md section OAuth → 2K
5. Edit pour ajouter Apple (similaire à Google) → 5K
6. Tests → 2K
7. TodoWrite → 1K

**Économie** : 75% de tokens

---

### Exemple 2 : "Refactorer le module users"

**❌ Approche non optimisée** (100K tokens) :

1. Read CLAUDE.md pour SOLID → 15K
2. Read tous les fichiers users → 30K
3. Read fichiers liés → 20K
4. Planification → 10K
5. Implémentation → 15K
6. Tests → 10K

**✅ Approche optimisée** (30K tokens) :

1. Agent general-purpose : "Analyse le module users et identifie les violations SOLID" → 10K (agent retourne résumé)
2. Read uniquement les fichiers avec problèmes → 8K
3. Edit refactoring ciblé → 7K
4. Tests → 3K
5. TodoWrite → 2K

**Économie** : 70% de tokens

---

## 📊 Monitoring de la Consommation

### Indicateurs à surveiller

- **Tokens utilisés** : Visible dans la conversation
- **Fichiers lus** : Compter les appels Read
- **Agents lancés** : Nombre d'agents utilisés

### Signaux d'alarme

🚨 **Vous consommez trop si** :

- Plus de 10 fichiers Read pour une tâche simple
- Read de gros fichiers (>500 lignes) sans --limit
- Répétition du contexte projet à chaque message
- Aucun agent utilisé pour une tâche complexe

✅ **Vous êtes optimisé si** :

- Moins de 5 fichiers Read par tâche
- Grep/Glob utilisés avant Read
- PROJECT_CONTEXT.md lu en premier
- Agents utilisés pour recherches complexes

---

## 🎯 Objectifs d'Optimisation

### Par Conversation (200K tokens max)

- **Minimum** : 4-5 tâches complètes
- **Optimal** : 6-8 tâches complètes
- **Excellent** : 10+ tâches complètes

### Par Tâche

- **Simple (bug fix)** : < 10K tokens
- **Moyenne (feature)** : 20-40K tokens
- **Complexe (refactor)** : 40-60K tokens

---

## 📚 Ressources Connexes

- **Contexte projet** : `/.claude/PROJECT_CONTEXT.md`
- **Agents disponibles** : `/.claude/AGENTS.md`
- **Workflows standards** : `/.claude/WORKFLOWS.md`
- **Outils et commandes** : `/.claude/TOOLS.md`

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-16
**Tokens consommés pour créer ce guide** : ~4 000 (optimisé !)
