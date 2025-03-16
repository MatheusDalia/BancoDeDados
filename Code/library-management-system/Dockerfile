# Stage 1: Build the application
FROM node:23-alpine AS builder
WORKDIR /app

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

# Install pnpm globally in the production image
RUN npm install -g pnpm

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# Copy the built files from the builder stage
COPY --from=builder /app/dist ./dist

# Create the data directory for SQLite
RUN mkdir -p ./data

EXPOSE 3000

CMD ["node", "dist/main.js"]
