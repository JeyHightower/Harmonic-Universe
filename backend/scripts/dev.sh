#!/bin/bash

# ======================================
# Harmonic Universe - Backend Development
# ======================================
#
# This script starts the backend development server.

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts-new/core.sh"
source "$PROJECT_ROOT/scripts-new/utils.sh"

# Welcome message
print_banner
log_info "Starting Harmonic Universe Backend Development Server..."

# Change to backend directory
cd "$ROOT_DIR"

# Check for virtual environment
if [ ! -d "venv" ]; then
    log_error "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate

# Check for Flask app
if [ ! -f "app.py" ]; then
    log_error "app.py not found. Are you in the backend directory?"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    log_info "Loading environment variables..."
    export $(grep -v '^#' .env | xargs)
else
    log_warning ".env file not found. Using default environment variables."
    export FLASK_APP=app.py
    export FLASK_ENV=development
    export PORT=5001
fi

# Start Flask development server
log_info "Starting Flask server on port ${PORT:-5001}..."
flask run --port=${PORT:-5001} --no-debugger 