FROM node:23-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV DATABASE_URL=postgresql://bookuser:bookpass@postgres:5432/book_collection
# Generate Prisma Client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Copy and make entrypoint executable
COPY docker-entrypoint.sh /usr/local/bin/
USER root
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER nestjs

# Use entrypoint for migrations
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application
CMD ["node", "dist/src/main"]
