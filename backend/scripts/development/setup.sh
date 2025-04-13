#!/bin/bash

# ======================================
# Harmonic Universe - Setup Script
# ======================================
#
# This script sets up the Harmonic Universe project environment.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Welcome message
print_banner
log_info "Starting Harmonic Universe setup..."

# =====================
# Check Prerequisites
# =====================
check_prerequisites
if [ $? -ne 0 ]; then
    log_error "Prerequisites check failed. Please install the missing requirements and try again."
    exit 1
fi

# =====================
# Project Setup
# =====================

# Setup root directory
ROOT_DIR=$(get_root_dir)
cd "$ROOT_DIR"

log_info "Setting up project in $ROOT_DIR..."

# Install OS-specific dependencies
if confirm "Do you want to install OS dependencies?"; then
    install_os_dependencies
fi

# Setup frontend
log_info "Setting up frontend..."
cd "$ROOT_DIR/frontend"

# Install frontend dependencies
if check_package_json "."; then
    log_info "Installing frontend dependencies..."
    install_node_dependencies "."
    log_success "Frontend dependencies installed."
else
    log_error "Frontend package.json not found."
    exit 1
fi

# Setup backend
log_info "Setting up backend..."
cd "$ROOT_DIR/backend"

# Create virtual environment
if confirm "Do you want to set up a Python virtual environment?"; then
    setup_python_venv "venv"
fi

# Initialize database
if confirm "Do you want to initialize the database?"; then
    log_info "Please enter database credentials:"
    read -p "Database name [harmonic_universe]: " db_name
    db_name=${db_name:-harmonic_universe}
    
    read -p "Database user [harmonic_user]: " db_user
    db_user=${db_user:-harmonic_user}
    
    read -p "Database password [harmonic_password]: " db_password
    db_password=${db_password:-harmonic_password}
    
    init_database "$db_name" "$db_user" "$db_password"
fi

# Create .env file
if [ ! -f ".env" ]; then
    log_info "Creating .env file..."
    cat > .env << EOF
# Database configuration
DB_USER=${db_user:-harmonic_user}
DB_PASSWORD=${db_password:-harmonic_password}
DB_NAME=${db_name:-harmonic_universe}
DB_HOST=localhost
DB_PORT=5432

# Application configuration
SECRET_KEY=$(openssl rand -hex 24)
DEBUG=True
FLASK_APP=app.py
FLASK_ENV=development
PORT=5001

# Frontend URL
FRONTEND_URL=http://localhost:5173
EOF
    log_success ".env file created."
fi

# Return to root
cd "$ROOT_DIR"

# Make scripts executable
log_info "Making scripts executable..."
find "$ROOT_DIR/scripts-new" -name "*.sh" -type f -exec chmod +x {} \;
find "$ROOT_DIR/frontend/scripts-new" -name "*.sh" -type f -exec chmod +x {} \;
find "$ROOT_DIR/backend/scripts-new" -name "*.sh" -type f -exec chmod +x {} \;

log_success "Harmonic Universe setup completed successfully!"
log_info "You can now start the development servers with:"
log_info "  - Backend: ./scripts-new/dev.sh backend"
log_info "  - Frontend: ./scripts-new/dev.sh frontend"
log_info "  - Both: ./scripts-new/dev.sh" 