#!/bin/bash
# Script pour exécuter des commandes DB sur la base locale
# Usage: ./scripts/db-local.sh <command>
# Example: ./scripts/db-local.sh "bun run db:push"

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kpsull-db"
echo "🔒 Using LOCAL database: localhost:5432/kpsull-db"
eval "$@"
