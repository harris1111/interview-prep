# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN pnpm --filter shared build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# Production stage
FROM node:20-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY scripts/entrypoint.sh ./entrypoint.sh

RUN chmod +x entrypoint.sh
RUN mkdir -p /app/uploads

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
