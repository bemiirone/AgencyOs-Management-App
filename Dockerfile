# Multi-stage build for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build NestJS app
RUN npx nx build web-server --configuration=production

# Production image
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/web-server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
