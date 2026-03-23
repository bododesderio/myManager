# ── Stage 1: Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json turbo.json ./
COPY apps/web/package.json ./apps/web/
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
RUN echo "shamefully-hoist=true" > .npmrc
RUN pnpm install --frozen-lockfile

# Now copy all source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build-time env vars (non-secret — just enough for Next.js to compile)
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build-time-placeholder-secret-32chars-min
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

RUN echo "shamefully-hoist=true" >> .npmrc && pnpm install --frozen-lockfile --ignore-scripts && pnpm --filter @mymanager/web run build

# ── Stage 2: Production runtime ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
