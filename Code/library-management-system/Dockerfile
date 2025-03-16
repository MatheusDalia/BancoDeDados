# Stage 1: Builder – use full Node 22 image for building native modules
FROM node:22 AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Copy package and configuration files (so ENV is in effect during dependency install)
COPY package.json ./
COPY .prettierrc ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./

# Install dependencies with pnpm (force reinstall to ensure native modules are built)
RUN pnpm install --no-frozen-lockfile --force

# Rebuild better-sqlite3 so it’s compiled with the correct ABI for Node 22
RUN pnpm rebuild better-sqlite3

# Copy the rest of the application source code and build the app
COPY . .
RUN pnpm run build

# Create a startup script that runs migrations then starts the app
RUN echo '#!/bin/sh\n\
    echo "Running migrations..."\n\
    node dist/cli/database.cli.js migrate\n\
    echo "Starting application..."\n\
    node dist/main.js' > /app/start.sh && chmod +x /app/start.sh

# Stage 2: Production – use a slim image to reduce final size
FROM node:22-slim AS runtime
WORKDIR /app

# (Optional) Install any runtime dependencies, e.g. SQLite libraries
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev && rm -rf /var/lib/apt/lists/*

# Copy built assets and node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/start.sh ./start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
