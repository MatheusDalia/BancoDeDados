# Use Node.js 20 for better compatibility
FROM node:20-slim

WORKDIR /app

# Install build dependencies and SQLite
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Create temporary package.json with downgraded swagger version
RUN cat package.json | sed 's/"@nestjs\/swagger": "\^11.0.6"/"@nestjs\/swagger": "\^10.0.0"/' > temp.json && \
    mv temp.json package.json

# Install with npm with legacy-peer-deps to bypass dependency conflicts
RUN npm install --unsafe-perm --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
