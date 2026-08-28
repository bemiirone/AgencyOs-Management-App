# Multi-stage build for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build NestJS app
RUN pnpm nx build web-server --prod

# Production image
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist/agency-os/web-server ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
