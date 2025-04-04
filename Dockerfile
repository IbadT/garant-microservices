# Build stage
FROM node:21-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:21-alpine AS production

WORKDIR /app

# Install netcat for database connection check
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4200

# Expose the ports
EXPOSE 4200
EXPOSE 50051

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Development stage
FROM node:21-alpine AS development

WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache python3 make g++ netcat-openbsd

# Install concurrently globally
RUN npm install -g concurrently

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=development
ENV PORT=4200

# Expose the ports
EXPOSE 4200
EXPOSE 50051

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]