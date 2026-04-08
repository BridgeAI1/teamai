# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY server.js .
COPY handlers ./handlers
COPY services ./services
COPY config ./config
COPY prompts ./prompts
COPY data ./data
COPY package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "server.js"]
