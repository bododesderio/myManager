# ── Stage 1: Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/constants/package.json ./packages/constants/
COPY packages/emails/package.json ./packages/emails/
COPY packages/seo/package.json ./packages/seo/
COPY packages/translations/package.json ./packages/translations/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validators/package.json ./packages/validators/

# Install all deps (cached unless manifests change)
RUN pnpm install --frozen-lockfile

# Now copy all source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate prisma client & build API
RUN cd apps/api && npx --yes prisma@6.19.2 generate
RUN pnpm --filter @mymanager/api run build

# ── Stage 2: Production runtime ──────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
ENV NODE_ENV=production

# Copy the built API and all node_modules (pnpm symlink structure)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /app/apps/api

# Create uploads directory writable by node user
RUN mkdir -p ./uploads && chown node:node ./uploads

EXPOSE 3001

USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node --import tsx dist/main.js"]
