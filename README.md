# Kpsull - Marketplace SaaS

Plateforme marketplace permettant aux créateurs de vendre leurs produits.

## Stack Technique

- **Runtime:** [Bun](https://bun.sh/)
- **Frontend:** Next.js 15, React 19, TailwindCSS
- **Backend:** Next.js API Routes, Prisma 7, PostgreSQL
- **Auth:** NextAuth v5 (Auth.js)
- **Paiements:** Stripe Connect

## Structure

```
.
├── src/              # Code source Next.js
│   ├── app/          # Routes (App Router)
│   ├── components/   # Composants React
│   ├── lib/          # Utilitaires et configs
│   ├── modules/      # Modules métier (hexagonal)
│   └── shared/       # Code partagé
├── prisma/           # Schéma et migrations
├── public/           # Assets statiques
└── docker/           # Configs Docker
```

## Installation

```bash
# Prérequis: Bun et Docker

# Installer les dépendances
bun install

# Copier les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés
```

## Développement

```bash
# Démarrer PostgreSQL
docker compose -f docker/docker-compose.postgres.yml up -d

# Setup base de données
bun run db:generate
bun run db:push
bun run db:seed

# Lancer le serveur
bun run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Scripts

| Commande | Description |
|----------|-------------|
| `bun run dev` | Serveur de développement |
| `bun run build` | Build de production |
| `bun run start` | Démarrer le build |
| `bun run lint` | Linter ESLint |
| `bun run check` | Vérification TypeScript |
| `bun run test` | Tests unitaires |
| `bun run test:watch` | Tests en mode watch |
| `bun run format` | Formater (Prettier) |
| `bun run db:generate` | Générer client Prisma |
| `bun run db:push` | Appliquer schéma |
| `bun run db:migrate` | Créer migration |
| `bun run db:studio` | Prisma Studio |
| `bun run db:seed` | Peupler données test |

## Documentation

- [Configuration environnement](.env.example)
- [Schéma base de données](prisma/schema.prisma)
