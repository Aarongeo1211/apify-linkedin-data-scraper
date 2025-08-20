# Stage 1: Build the React frontend
FROM node:18-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 2: Create the final production image
FROM node:18-alpine
WORKDIR /app

# Copy backend dependencies and install
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm install --prefix backend --production

# Copy backend source code
COPY backend ./backend/

# Copy the built frontend from the builder stage
COPY --from=builder /app/frontend/build ./frontend/build

# Expose the port the app runs on
EXPOSE 5001

# The command to start the server
CMD ["node", "backend/src/server.js"]
