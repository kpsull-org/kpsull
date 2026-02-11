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
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

# Install prisma CLI globally (local copy kept for 'prisma/config' module resolution)
RUN npm install -g prisma@7

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Startup: diagnostics + migrate + server
CMD ["/bin/sh", "-c", "\
  echo '========== STARTUP DIAGNOSTICS ==========' && \
  echo \"DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo 'YES' || echo 'NO - MISSING!')\" && \
  echo \"DB Host: $(echo $DATABASE_URL | sed -n 's|.*@\\([^:]*\\):.*|\\1|p')\" && \
  echo \"DB Port: $(echo $DATABASE_URL | sed -n 's|.*:\\([0-9]*\\)/.*|\\1|p')\" && \
  echo \"DB Name: $(echo $DATABASE_URL | sed -n 's|.*/\\([^?]*\\).*|\\1|p')\" && \
  echo '--- Testing DNS resolution ---' && \
  DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\\([^:]*\\):.*|\\1|p') && \
  wget -q --spider --timeout=5 $DB_HOST:$(echo $DATABASE_URL | sed -n 's|.*:\\([0-9]*\\)/.*|\\1|p') 2>&1 && echo \"DNS + TCP: OK\" || echo \"DNS/TCP check: wget returned error (may be normal for non-HTTP)\" && \
  echo '--- Testing DB connection with node ---' && \
  node -e \" \
    const url = process.env.DATABASE_URL; \
    if (!url) { console.error('FATAL: DATABASE_URL is not set'); process.exit(1); } \
    const u = new URL(url); \
    console.log('Connecting to:', u.hostname + ':' + u.port + u.pathname); \
    const net = require('net'); \
    const sock = new net.Socket(); \
    sock.setTimeout(5000); \
    sock.on('connect', () => { console.log('TCP connection: OK'); sock.destroy(); process.exit(0); }); \
    sock.on('timeout', () => { console.error('TCP connection: TIMEOUT after 5s'); sock.destroy(); process.exit(1); }); \
    sock.on('error', (e) => { console.error('TCP connection: FAILED -', e.message); process.exit(1); }); \
    sock.connect(parseInt(u.port) || 5432, u.hostname); \
  \" && \
  echo '========== RUNNING PRISMA MIGRATE ==========' && \
  prisma migrate deploy && \
  echo '========== STARTING SERVER ==========' && \
  node server.js \
"]
