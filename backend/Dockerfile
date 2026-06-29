# Stage 1: Build & Install dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy server code
COPY . .

# Stage 2: Production runner (keeps image size extremely small for 1GB RAM limits)
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy only the application source code (NOT node_modules from builder)
COPY --from=builder /app/server.js ./
COPY --from=builder /app/config ./config/
COPY --from=builder /app/controllers ./controllers/
COPY --from=builder /app/handlers ./handlers/
COPY --from=builder /app/middleware ./middleware/
COPY --from=builder /app/models ./models/
COPY --from=builder /app/routes ./routes/
COPY --from=builder /app/services ./services/
COPY --from=builder /app/sockets ./sockets/
COPY --from=builder /app/utils ./utils/
COPY --from=builder /app/ecosystem.config.js ./

# Create uploads directory
RUN mkdir -p uploads

# Expose server port (default 5000)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
