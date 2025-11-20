# Multi-stage build: Build Vue app, then serve with Caddy

FROM node:23-alpine AS build

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Vue app (creates /app/dist)
RUN pnpm build

# Production stage with Caddy web server
FROM caddy:2-alpine

# Copy built assets from build stage
COPY --from=build /app/dist /srv

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Expose HTTP and HTTPS ports
EXPOSE 80 443
