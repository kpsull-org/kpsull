FROM oven/bun:1-slim AS base
LABEL org.opencontainers.image.source="https://github.com/kpsull-org/kpsull"

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/
RUN bun install --frozen-lockfile
RUN bunx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXTAUTH_SECRET=build-placeholder
ARG NEXTAUTH_URL=http://localhost:3000
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ARG STRIPE_SECRET_KEY=placeholder_stripe_key_for_build
ARG STRIPE_WEBHOOK_SECRET=placeholder_webhook_secret_for_build

RUN NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    DATABASE_URL=$DATABASE_URL \
    STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
    STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET \
    bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl wget && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 appgroup
RUN useradd --system --uid 1001 --gid appgroup --no-create-home appuser

COPY --from=builder /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install prisma CLI for migrate deploy
RUN bun add -g prisma@7

# Create a minimal prisma config for Docker runtime (no heavy deps needed)
RUN printf 'export default {\n  schema: "prisma/schema.prisma",\n  datasource: {\n    url: process.env.DATABASE_URL,\n  },\n};\n' > prisma.config.mjs

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://localhost:${PORT:-3000}/ || exit 1

# Startup: diagnostics (non-blocking) + migrate + server
CMD ["/bin/sh", "-c", "\
  echo '========== STARTUP DIAGNOSTICS ==========' && \
  echo \"DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo 'YES' || echo 'NO - MISSING!')\" && \
  echo \"DB Host: $(echo $DATABASE_URL | sed -n 's|.*@\\([^:]*\\):.*|\\1|p')\" && \
  echo \"DB Port: $(echo $DATABASE_URL | sed -n 's|.*:\\([0-9]*\\)/.*|\\1|p')\" && \
  echo \"DB Name: $(echo $DATABASE_URL | sed -n 's|.*/\\([^?]*\\).*|\\1|p')\" && \
  echo '--- Testing TCP connection to DB (3s timeout) ---' && \
  bun -e \" \
    const url = process.env.DATABASE_URL; \
    if (!url) { console.error('FATAL: DATABASE_URL is not set'); process.exit(1); } \
    const u = new URL(url); \
    console.log('Target:', u.hostname + ':' + (u.port || '5432') + u.pathname); \
    const net = require('net'); \
    const sock = new net.Socket(); \
    sock.setTimeout(3000); \
    sock.on('connect', () => { console.log('TCP OK - DB is reachable'); sock.destroy(); process.exit(0); }); \
    sock.on('timeout', () => { console.error('TCP TIMEOUT - DB not reachable after 3s'); sock.destroy(); process.exit(1); }); \
    sock.on('error', (e) => { console.error('TCP FAILED:', e.message); process.exit(1); }); \
    sock.connect(parseInt(u.port) || 5432, u.hostname); \
  \" && \
  echo '========== RUNNING PRISMA MIGRATE ==========' && \
  bunx prisma migrate deploy --schema prisma/schema.prisma 2>&1 && \
  echo '========== RUNNING SEED ==========' && \
  (bun run prisma/seed.ts 2>&1 || echo 'SEED WARNING: seed failed but continuing startup...') && \
  echo '========== STARTING SERVER ==========' && \
  bun server.js || \
  echo 'STARTUP FAILED - check logs above for details' \
"]
