#!/bin/bash

# ===========================================
# Harmonic Universe - Environment Setup
# ===========================================
# This script creates .env files for both backend and frontend

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Setup backend environment
setup_backend_env() {
    log_info "Setting up backend environment..."

    if [ ! -f "backend/.env" ]; then
        log_info "Creating backend .env file..."
        cat > backend/.env << 'EOL'
# Database Configuration
DATABASE_URL=postgresql://harmonic_user:harmonic_password@localhost:5432/harmonic_universe

# Flask Configuration
FLASK_APP=wsgi.py
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=development_secret_key_change_in_production

# Server Configuration
PORT=5001
HOST=0.0.0.0

# Development Settings
PYTHONPATH=/app
DEBUG=True
EOL
        log_success "Backend .env file created at backend/.env"
    else
        log_warning "Backend .env file already exists. Skipping creation."
    fi
}

# Setup frontend environment
setup_frontend_env() {
    log_info "Setting up frontend environment..."

    if [ ! -f "frontend/.env" ]; then
        log_info "Creating frontend .env file..."
        cat > frontend/.env << 'EOL'
# API Configuration
VITE_API_URL=http://localhost:5001

# Development Settings
NODE_ENV=development
HOST=0.0.0.0
PORT=5173

# Build Settings
NODE_OPTIONS=--max_old_space_size=2048
EOL
        log_success "Frontend .env file created at frontend/.env"
    else
        log_warning "Frontend .env file already exists. Skipping creation."
    fi
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "   Harmonic Universe - Environment Setup"
    echo "=============================================="
    echo -e "${NC}"

    setup_backend_env
    echo ""
    setup_frontend_env
    echo ""

    log_success "Environment setup completed!"
    echo ""
    log_info "Next steps:"
    echo "  1. Review and modify the .env files as needed"
    echo "  2. Run './restore-database.sh' to set up databases"
    echo "  3. Start development with 'docker-compose up' or run services individually"
}

main "$@"
