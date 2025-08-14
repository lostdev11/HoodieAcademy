# Multi-stage build for security and optimization
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (not just production) for Tailwind + PostCSS builds
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies for runtime
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built application from build stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

# Create necessary directories with proper permissions
RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"] 