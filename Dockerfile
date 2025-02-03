# Build stage for frontend
FROM node:18 AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --ignore-scripts

# Copy frontend source code
COPY frontend/ ./

# Build frontend application
RUN npm run build

# Build stage for backend
FROM node:18 AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install backend dependencies
RUN npm ci --ignore-scripts

# Copy backend source code
COPY . .

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend from backend-builder stage
COPY --from=backend-builder /app/dist ./dist

# Copy necessary files
COPY .env.example .env

# Create necessary directories
RUN mkdir -p logs uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/server.js"]
