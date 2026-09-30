# syntax=docker/dockerfile:1
# JanSetu AI - Google Cloud Run Container Specification
# Digital Public Good for Citizen Voice & Infrastructure Intelligence
# Optimized for production deployment with security and performance best practices

# Step 1: Build the Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci && npm cache clean --force
COPY client/ ./
RUN npm run build

# Step 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install server dependencies with production flag
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# Copy server code and client build
WORKDIR /app
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 8080

CMD ["node", "server/server.js"]
