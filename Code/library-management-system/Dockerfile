# Stage 1: Builder – use full Node 22 image for building native modules and running migrations
FROM node:22 AS builder
WORKDIR /app

# Install build tools and SQLite dependencies
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

# Copy package and configuration files so that dependencies can be installed
COPY package.json ./
COPY .prettierrc ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./

# IMPORTANT: Ensure your migrations folder is copied – do not list it in .dockerignore!
COPY migrations ./migrations

# Install dependencies (forcing rebuild of native modules)
RUN pnpm install --no-frozen-lockfile --force
RUN pnpm rebuild better-sqlite3

# Copy the rest of the application source code
COPY . .

# Build the application
RUN pnpm run build

# Create a startup script that first runs migrations then starts the app
RUN echo '#!/bin/sh\n\
    echo "Running database migrations..."\n\
    node dist/cli/database.cli.js migrate\n\
    echo "Starting application..."\n\
    node dist/main.js' > /app/start.sh && chmod +x /app/start.sh

# Stage 2: Production runtime – use a slim Node 22 image for a smaller final image
FROM node:22-slim AS runtime
WORKDIR /app

# (Optional) Install runtime dependencies (SQLite libraries)
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev && rm -rf /var/lib/apt/lists/*

# Copy built assets and node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/start.sh ./start.sh
# Also copy the migrations folder if your app or CLI needs it at runtime
COPY --from=builder /app/migrations ./migrations

EXPOSE 3000
CMD ["/app/start.sh"]
