# Agents IA Disponibles pour KpSull

> **But** : Liste exhaustive des agents IA spécialisés disponibles pour automatiser et optimiser le développement.

## 🤖 Agents Claude Code Intégrés

### 1. **general-purpose**

**Quand l'utiliser** :

- Recherche complexe multi-étapes dans le codebase
- Tâches nécessitant plusieurs fichiers et recherches
- Quand vous n'êtes pas sûr de trouver quelque chose en 1-2 tentatives

**Outils disponibles** : Tous (Read, Write, Edit, Glob, Grep, Bash, etc.)

**Exemple d'utilisation** :

```
"Recherche toutes les implémentations de l'authentification BetterAuth
dans le projet, analyse-les et propose des améliorations"
```

### 2. **statusline-setup**

**Quand l'utiliser** :

- Configuration de la barre de statut Claude Code
- Personnalisation de l'affichage CLI

**Outils disponibles** : Read, Edit

**Exemple d'utilisation** :

```
"Configure ma statusline pour afficher le nombre de tests passants"
```

### 3. **output-style-setup**

**Quand l'utiliser** :

- Création de styles de sortie personnalisés
- Formatage des réponses Claude Code

**Outils disponibles** : Read, Write, Edit, Glob, Grep

**Exemple d'utilisation** :

```
"Crée un style de sortie compact pour les résultats de tests"
```

## 🛠️ Agents Personnalisés (`.claude/agents/`)

### 4. **test-runner** (À créer)

**Objectif** : Exécuter les tests automatiquement après modifications
**Workflow** :

1. Détecte les fichiers modifiés
2. Identifie les tests associés
3. Exécute uniquement les tests pertinents
4. Génère un rapport de couverture

**Commande** : `/test-runner [frontend|backend|all]`

### 5. **code-reviewer** (À créer)

**Objectif** : Revue de code automatique avant commit
**Workflow** :

1. Vérifie le respect des principes SOLID
2. Analyse la couverture de tests
3. Détecte les code smells
4. Suggère des améliorations

**Commande** : `/code-review`

### 6. **prisma-helper** (À créer)

**Objectif** : Assistance pour les migrations Prisma
**Workflow** :

1. Analyse le schéma Prisma
2. Génère les migrations
3. Met à jour le client Prisma
4. Vérifie la cohérence des modèles

**Commande** : `/prisma [migrate|generate|reset]`

### 7. **component-generator** (À créer)

**Objectif** : Génération de composants React avec tests TDD
**Workflow** :

1. Demande les spécifications du composant
2. Génère d'abord les tests (Red phase)
3. Génère le composant minimal (Green phase)
4. Propose des refactorings (Refactor phase)

**Commande** : `/component [ComponentName]`

### 8. **api-endpoint-builder** (À créer)

**Objectif** : Création d'endpoints NestJS avec tests
**Workflow** :

1. Génère le controller avec validations
2. Génère le service avec logique métier
3. Génère les tests E2E
4. Met à jour la documentation OpenAPI

**Commande** : `/api [resource-name] [actions]`

### 9. **solid-validator** (À créer)

**Objectif** : Valider le respect des principes SOLID
**Workflow** :

1. Analyse le code selon les 5 principes
2. Identifie les violations
3. Propose des refactorings
4. Génère un rapport

**Commande** : `/solid-check [file-path]`

### 10. **dependency-updater** (À créer)

**Objectif** : Mise à jour sécurisée des dépendances
**Workflow** :

1. Check les dépendances obsolètes
2. Analyse les breaking changes
3. Met à jour package.json
4. Exécute les tests pour valider

**Commande** : `/deps update`

## 🎯 Agents MCP (Model Context Protocol)

Configuration : `/.mcp.json`

### 11. **context7** (Upstash)

**Objectif** : Gestion du contexte conversationnel
**Commande** : Automatique via `npx -y @upstash/context7-mcp`

### 12. **playwright-mcp-server**

**Objectif** : Automatisation des tests E2E Playwright
**Commande** : Automatique via `npx -y @executeautomation/playwright-mcp-server`

## 📝 Comment créer un nouvel agent ?

### Structure d'un agent

```markdown
# Agent Name

## Purpose

Description claire de l'objectif de l'agent

## When to use

Liste des situations où cet agent est pertinent

## Input parameters

- param1: description
- param2: description

## Workflow

1. Étape 1
2. Étape 2
3. Étape 3

## Output

Description de ce que l'agent retourne

## Example
```

/agent-name --param value

```

```

### Créer un fichier agent

```bash
# Créer un nouvel agent
cat > .claude/agents/mon-agent.md << 'EOF'
# Mon Agent

## Purpose
[Description]

## Workflow
1. [Étape 1]
2. [Étape 2]
EOF
```

## 🚀 Bonnes Pratiques d'Utilisation des Agents

### 1. **Utiliser le bon agent pour la bonne tâche**

- ❌ Ne pas utiliser `general-purpose` pour une simple lecture de fichier
- ✅ Utiliser `general-purpose` pour des recherches complexes multi-fichiers

### 2. **Spécifier clairement les attentes**

```
# ❌ Mauvais
"Regarde le code"

# ✅ Bon
"Agent general-purpose : Analyse toutes les occurrences de BetterAuth
dans le projet et identifie les points d'amélioration de sécurité"
```

### 3. **Chaîner les agents pour les tâches complexes**

```
1. Agent code-reviewer → Identifier les problèmes
2. Agent test-runner → Vérifier que les tests passent
3. Agent solid-validator → Valider les principes SOLID
```

### 4. **Économiser le contexte**

- Utiliser les agents spécialisés plutôt que de lire tous les fichiers
- Les agents travaillent de manière autonome et retournent uniquement le résumé

## 📊 Matrice de Décision : Quel Agent Utiliser ?

| Tâche                     | Agent Recommandé        | Raison                         |
| ------------------------- | ----------------------- | ------------------------------ |
| Recherche multi-fichiers  | `general-purpose`       | Accès à tous les outils        |
| Créer un composant React  | `component-generator`   | Workflow TDD intégré           |
| Ajouter un endpoint API   | `api-endpoint-builder`  | Génération complète avec tests |
| Revue de code             | `code-reviewer`         | Vérifie SOLID + tests          |
| Exécuter les tests        | `test-runner`           | Tests ciblés automatiques      |
| Migration base de données | `prisma-helper`         | Gestion Prisma complète        |
| Valider SOLID             | `solid-validator`       | Analyse spécialisée            |
| Update dépendances        | `dependency-updater`    | Check breaking changes         |
| Tests E2E                 | `playwright-mcp-server` | Intégration Playwright         |

## 🔧 Configuration Avancée

### Activer/Désactiver des agents

Modifier `.claude/settings.local.json` :

```json
{
  "agents": {
    "general-purpose": true,
    "code-reviewer": true,
    "test-runner": false
  }
}
```

### Définir des alias pour les agents

Créer des slash commands dans `.claude/commands/` :

```bash
# .claude/commands/review.md
Utilise l'agent code-reviewer pour analyser les fichiers modifiés
```

Ensuite : `/review`

## 📚 Ressources

- **Documentation Claude Code** : https://docs.claude.com/claude-code
- **Documentation MCP** : https://modelcontextprotocol.io/
- **Agents personnalisés** : `.claude/agents/`

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-16
