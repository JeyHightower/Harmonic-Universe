#!/bin/bash

# ======================================
# Harmonic Universe - Backend Setup
# ======================================
#
# This script sets up the backend environment.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts-new/core.sh"
source "$PROJECT_ROOT/scripts-new/utils.sh"

# Welcome message
print_banner
log_info "Setting up Harmonic Universe Backend..."

# Change to backend directory
cd "$ROOT_DIR"

# Create virtual environment
if [ ! -d "venv" ]; then
    log_info "Creating virtual environment..."
    execute_command "python3 -m venv venv" "Creating virtual environment"
else
    log_info "Virtual environment already exists."
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate

# Install requirements
if [ -f "requirements.txt" ]; then
    log_info "Installing Python dependencies..."
    execute_command "pip install -r requirements.txt" "Installing Python dependencies"
else
    log_error "requirements.txt not found."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    log_info "Creating .env file..."
    cat > .env << EOF
# Database configuration
DB_USER=harmonic_user
DB_PASSWORD=harmonic_password
DB_NAME=harmonic_universe
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

# Initialize database
if confirm "Do you want to initialize the database?"; then
    log_info "Initializing database..."
    
    # Source .env file
    source .env
    
    # Initialize database
    init_database "$DB_NAME" "$DB_USER" "$DB_PASSWORD"
    
    # Apply migrations if flask-migrate is used
    if grep -q "flask-migrate" "requirements.txt" || grep -q "Flask-Migrate" "requirements.txt"; then
        log_info "Applying database migrations..."
        flask db init
        flask db migrate -m "Initial migration"
        flask db upgrade
    fi
fi

log_success "Backend setup completed successfully!"
log_info "You can start the development server with:"
log_info "  flask run --port=5001" 