# ============================================================================
# Multi-stage Dockerfile for apps/api (NestJS Modular Monolith + Prisma ORM)
# Aligns with ADR-006 & Component/Deployment Diagrams (brewlite-api:latest)
# ============================================================================

# Stage 1: Install clean dependencies from package-lock.json
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Generate Prisma Client & Build NestJS TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Stage 3: Minimal Non-root Production Runtime Image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
USER node

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

EXPOSE 3001
CMD ["node", "dist/main.js"]
