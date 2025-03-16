# Stage 1: Build the application
FROM node:23-alpine AS builder
WORKDIR /app

# Install build dependencies required for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc git

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files and lockfile
COPY package.json pnpm-lock.yaml ./

# Install all dependencies using pnpm
RUN pnpm install

# Copy the rest of the source code and build the application
COPY . .
RUN pnpm run build

# Stage 2: Production image
FROM node:23-alpine AS runner
WORKDIR /app

# Install runtime dependencies required for better-sqlite3
RUN apk add --no-cache sqlite

# Install pnpm globally in the production image
RUN npm install -g pnpm

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml ./

# Install production dependencies with native module rebuild
RUN apk add --no-cache python3 make g++ gcc git && \
    pnpm install --prod && \
    apk del python3 make g++ gcc git

# Copy the migrations directory and .env file
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/dist ./dist
COPY .env ./.env

# Create the data directory for SQLite
RUN mkdir -p ./data

EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
