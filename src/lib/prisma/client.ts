import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Reuse pool in development to avoid connection exhaustion
const pool = globalForPrisma.pool ?? new pg.Pool({
  connectionString,
  // PAS de connectionTimeoutMillis → les requêtes font la queue au lieu d'échouer.
  // Avec un timeout, un pic de charge éjecte les utilisateurs avec une erreur 500.
  // Sans timeout, elles attendent leur tour — légèrement plus lentes mais jamais cassées.
  max: 20,                  // Connexions simultanées (adapter selon le plan Railway DB)
  min: 2,                   // 2 connexions "chaudes" pour éviter la latence au premier hit
  idleTimeoutMillis: 30000, // Libérer les connexions inactives après 30s
  allowExitOnIdle: false,   // Maintenir le pool actif même sans trafic
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export default prisma;
