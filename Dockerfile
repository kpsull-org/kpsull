FROM node:22-slim AS base
LABEL org.opencontainers.image.source="https://github.com/kpsull-org/kpsull"

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl wget && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install prisma CLI globally (schema.prisma has url=env("DATABASE_URL"), no config.ts needed)
RUN npm install -g prisma@7

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Startup: diagnostics (non-blocking) + migrate + server
CMD ["/bin/sh", "-c", "\
  echo '========== STARTUP DIAGNOSTICS ==========' && \
  echo \"DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo 'YES' || echo 'NO - MISSING!')\" && \
  echo \"DB Host: $(echo $DATABASE_URL | sed -n 's|.*@\\([^:]*\\):.*|\\1|p')\" && \
  echo \"DB Port: $(echo $DATABASE_URL | sed -n 's|.*:\\([0-9]*\\)/.*|\\1|p')\" && \
  echo \"DB Name: $(echo $DATABASE_URL | sed -n 's|.*/\\([^?]*\\).*|\\1|p')\" && \
  echo '--- Testing TCP connection to DB (3s timeout) ---' && \
  node -e \" \
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
  prisma migrate deploy --schema prisma/schema.prisma 2>&1 && \
  echo '========== STARTING SERVER ==========' && \
  node server.js \
"]
