# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

# FRONTEND BUILD
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set up pnpm global bin directory
ENV PNPM_HOME=/usr/local/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

# Create .npmrc file
RUN echo "strict-peer-dependencies=false" > .npmrc

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/package.json

# Install dependencies
RUN pnpm install --filter frontend...

# Install vite and React plugin
RUN npm install -g vite
RUN npm install --save-dev @vitejs/plugin-react

# Copy frontend files
COPY frontend/ ./frontend/

# Build the frontend application (for production)
WORKDIR /app/frontend
RUN pnpm run build

# BACKEND BUILD
FROM python:3.11-slim AS backend-build

# Prevents Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1
ENV PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Create necessary directories
RUN mkdir -p /app/static

# Make scripts executable
RUN chmod +x scripts/*.sh && \
    chmod +x docker-entrypoint.sh

# DEVELOPMENT IMAGE
FROM python:3.11-slim AS dev

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
ENV FLASK_DEBUG=1
ENV PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    postgresql-client \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Copy the entrypoint script
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose ports for backend and frontend
EXPOSE 5001 5173

# This is a development image that will be used with mounted volumes
# from docker-compose, so we don't need to copy files here

# Set the entrypoint for development
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# PRODUCTION IMAGE
FROM python:3.11-slim AS prod

# Create a non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy from backend build stage
COPY --from=backend-build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-build /app /app

# Copy built frontend from frontend build stage (for serving static files)
COPY --from=frontend-build /app/frontend/dist /app/static/dist

# Ensure proper permissions
RUN chown -R appuser:appuser /app

# Expose the backend port
EXPOSE 5001

# Switch to non-privileged user
USER appuser

# Run the production server
CMD ["python", "run.py"]

# Nginx setup (if needed)
FROM nginx AS nginx_setup
RUN echo "<h1>Hello world from Docker!</h1>" > /usr/share/nginx/html/index.html
