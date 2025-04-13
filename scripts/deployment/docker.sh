#!/bin/bash

# ======================================
# Harmonic Universe - Docker Utilities
# ======================================
#
# This script provides utilities for Docker operations.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Function to create Dockerfile
create_dockerfile() {
    log_info "Creating Dockerfile..."
    
    cd "$ROOT_DIR"
    
    # Create Dockerfile
    cat > Dockerfile << EOF
# Use a multi-stage build for smaller final image
FROM node:16-alpine AS frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN pnpm run build

# Backend and final image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    postgresql-client \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn psycopg2-binary

# Copy backend files
COPY backend/ backend/
COPY wsgi.py .
COPY docker-entrypoint.sh .

# Copy built frontend from the frontend-build stage
COPY --from=frontend-build /app/frontend/dist backend/static/

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=backend/app.py
ENV FLASK_ENV=production

# Run the application
ENTRYPOINT ["./docker-entrypoint.sh"]
EOF
    
    log_success "Dockerfile created successfully."
    return 0
}

# Function to create docker-compose.yml
create_docker_compose() {
    log_info "Creating docker-compose.yml..."
    
    cd "$ROOT_DIR"
    
    # Create docker-compose.yml
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=harmonic_user
      - POSTGRES_PASSWORD=harmonic_password
      - POSTGRES_DB=harmonic_universe
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U harmonic_user -d harmonic_universe"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    restart: always
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://harmonic_user:harmonic_password@db:5432/harmonic_universe
      - SECRET_KEY=development_secret_key
      - FLASK_APP=backend/app.py
      - FLASK_ENV=production
      - PORT=5000
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app/backend
      - ./wsgi.py:/app/wsgi.py

volumes:
  postgres_data:
EOF
    
    log_success "docker-compose.yml created successfully."
    return 0
}

# Function to create docker-entrypoint.sh
create_docker_entrypoint() {
    log_info "Creating docker-entrypoint.sh..."
    
    cd "$ROOT_DIR"
    
    # Create docker-entrypoint.sh
    cat > docker-entrypoint.sh << EOF
#!/bin/bash
set -e

# Apply database migrations
flask db upgrade

# Start gunicorn
exec gunicorn --bind 0.0.0.0:\${PORT:-5000} --workers 4 wsgi:app
EOF
    
    # Make executable
    chmod +x docker-entrypoint.sh
    
    log_success "docker-entrypoint.sh created successfully."
    return 0
}

# Function to create .dockerignore
create_dockerignore() {
    log_info "Creating .dockerignore..."
    
    cd "$ROOT_DIR"
    
    # Create .dockerignore
    cat > .dockerignore << EOF
# Git
.git
.gitignore
.github

# Environment variables
.env
.env.*

# Virtual environment
venv/
.venv/
env/

# Python cache
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
.pytest_cache/

# JavaScript
node_modules/
frontend/node_modules/
frontend/dist/
frontend/build/
frontend/coverage/
frontend/.next/
frontend/.nuxt/
frontend/.cache/

# Editor directories and files
.idea/
.vscode/
*.swp
*.swo

# OS specific
.DS_Store
Thumbs.db

# Docker
.dockerignore
docker-compose*.yml
Dockerfile*

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Documentation
docs/

# Tests
**/tests/
**/test/
**/coverage/
EOF
    
    log_success ".dockerignore created successfully."
    return 0
}

# Function to build Docker image
build_docker_image() {
    log_info "Building Docker image..."
    
    cd "$ROOT_DIR"
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found. Please create it first with '$0 dockerfile'."
        return 1
    fi
    
    # Build Docker image
    execute_command "docker build -t harmonic-universe:latest ." "Building Docker image"
    
    log_success "Docker image built successfully."
    return 0
}

# Function to start Docker container
start_docker() {
    log_info "Starting Docker container..."
    
    cd "$ROOT_DIR"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found. Please create it first with '$0 compose'."
        return 1
    fi
    
    # Start Docker containers
    execute_command "docker-compose up -d" "Starting Docker containers"
    
    log_success "Docker containers started successfully."
    log_info "Backend API is available at http://localhost:5000"
    
    return 0
}

# Function to stop Docker container
stop_docker() {
    log_info "Stopping Docker container..."
    
    cd "$ROOT_DIR"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found. Please create it first with '$0 compose'."
        return 1
    fi
    
    # Stop Docker containers
    execute_command "docker-compose down" "Stopping Docker containers"
    
    log_success "Docker containers stopped successfully."
    return 0
}

# Function to setup Docker environment
setup_docker() {
    log_info "Setting up Docker environment..."
    
    # Create Dockerfile
    create_dockerfile
    
    # Create docker-compose.yml
    create_docker_compose
    
    # Create docker-entrypoint.sh
    create_docker_entrypoint
    
    # Create .dockerignore
    create_dockerignore
    
    log_success "Docker environment setup completed successfully."
    return 0
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-help}"
    
    case "$command" in
        dockerfile)
            create_dockerfile
            ;;
        compose)
            create_docker_compose
            ;;
        entrypoint)
            create_docker_entrypoint
            ;;
        ignore)
            create_dockerignore
            ;;
        build)
            build_docker_image
            ;;
        start)
            start_docker
            ;;
        stop)
            stop_docker
            ;;
        setup)
            setup_docker
            ;;
        help)
            log_info "Harmonic Universe Docker Utilities"
            log_info "Usage: $0 <command>"
            log_info ""
            log_info "Commands:"
            log_info "  dockerfile   Create Dockerfile"
            log_info "  compose      Create docker-compose.yml"
            log_info "  entrypoint   Create docker-entrypoint.sh"
            log_info "  ignore       Create .dockerignore"
            log_info "  build        Build Docker image"
            log_info "  start        Start Docker containers"
            log_info "  stop         Stop Docker containers"
            log_info "  setup        Setup complete Docker environment"
            log_info "  help         Show this help message"
            ;;
        *)
            log_error "Unknown command: $command"
            log_info "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 