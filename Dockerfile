# Multi-stage build for NestJS backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy monorepo files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build NestJS app
RUN npx nx build web-server --configuration=production

# Production image
FROM node:22-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/web-server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
