# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm install --prefix backend --production

# Copy backend source
COPY backend ./backend/

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/build ./frontend/build

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "backend/src/server.js"]