#!/bin/bash

# ==========================================
# Harmonic Universe - Database Restoration
# ==========================================
# This script restores the database for both Docker and local environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for database to be ready
wait_for_db() {
    local host=$1
    local port=$2
    local user=$3
    local db=$4
    local max_attempts=30
    local attempt=1

    log_info "Waiting for database to be ready at $host:$port..."

    while [ $attempt -le $max_attempts ]; do
        if PGPASSWORD=harmonic_password pg_isready -h "$host" -p "$port" -U "$user" -d "$db" >/dev/null 2>&1; then
            log_success "Database is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "Database failed to become ready after $max_attempts attempts"
    return 1
}

# Function to restore Docker environment
restore_docker() {
    log_info "Starting Docker database restoration..."

    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose down || true

    # Start only the database service
    log_info "Starting PostgreSQL database service..."
    docker-compose up -d db

    # Wait for database to be ready
    wait_for_db "localhost" "5432" "harmonic_user" "harmonic_universe"

    # Run migrations using docker-compose exec
    log_info "Running database migrations..."
    docker-compose exec -T db psql -U harmonic_user -d harmonic_universe -c "
        CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
        CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
    " || log_warning "Extensions may already exist"

    # Create tables using the backend service
    log_info "Creating database tables..."
    docker-compose run --rm backend python -c "
from app import create_app
from app.extensions import db
from app.api.models import *

app = create_app()
with app.app_context():
    db.create_all()
    print('All database tables created successfully')
"

    # Create demo data
    log_info "Creating demo data..."
    docker-compose run --rm backend python scripts/create_demo_data.py

    # Verify database setup
    log_info "Verifying database setup..."
    docker-compose exec -T db psql -U harmonic_user -d harmonic_universe -c "\dt" || log_error "Failed to list tables"

    log_success "Docker database restoration completed!"
}

# Function to restore local environment
restore_local() {
    log_info "Starting local database restoration..."

    # Check if local PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_error "Local PostgreSQL is not running. Please start PostgreSQL and try again."
        log_info "You can start PostgreSQL with: brew services start postgresql@15"
        return 1
    fi

    # Database credentials
    DB_USER="harmonic_user"
    DB_PASSWORD="harmonic_password"
    DB_NAME="harmonic_universe"

    # Check if user exists, create if not
    log_info "Setting up database user and database..."
    if ! psql -h localhost -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        log_info "Creating database user: $DB_USER"
        psql -h localhost -U postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
        psql -h localhost -U postgres -c "ALTER USER $DB_USER CREATEDB;"
    else
        log_info "Database user $DB_USER already exists"
    fi

    # Drop and recreate database
    log_info "Recreating database: $DB_NAME"
    psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
    psql -h localhost -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    # Create extensions
    log_info "Creating database extensions..."
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "
        CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
        CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
    " || log_warning "Extensions may already exist"

    # Set up environment variables for local development
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    export FLASK_APP="wsgi.py"
    export FLASK_ENV="development"
    export SECRET_KEY="development_secret_key"

    # Navigate to backend directory
    cd backend

    # Create tables using Flask
    log_info "Creating database tables locally..."
    python -c "
import sys
import os
sys.path.append('.')
from app import create_app
from app.extensions import db
from app.api.models import *

app = create_app()
with app.app_context():
    db.create_all()
    print('All database tables created successfully')
"

    # Create demo data locally
    log_info "Creating demo data locally..."
    python scripts/create_demo_data.py

    # Verify database setup
    log_info "Verifying local database setup..."
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "\dt" || log_error "Failed to list tables"

    # Go back to root directory
    cd ..

    log_success "Local database restoration completed!"
}

# Function to verify both environments
verify_setup() {
    log_info "Verifying both environments..."

    # Test Docker environment
    log_info "Testing Docker database connection..."
    if docker-compose exec -T db psql -U harmonic_user -d harmonic_universe -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
        log_success "Docker database is working correctly"
    else
        log_error "Docker database verification failed"
    fi

    # Test local environment
    log_info "Testing local database connection..."
    if PGPASSWORD=harmonic_password psql -h localhost -U harmonic_user -d harmonic_universe -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
        log_success "Local database is working correctly"
    else
        log_error "Local database verification failed"
    fi
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "   Harmonic Universe - Database Restoration"
    echo "=================================================="
    echo -e "${NC}"

    case "${1:-both}" in
        docker)
            restore_docker
            ;;
        local)
            restore_local
            ;;
        both)
            log_info "Restoring both Docker and local environments..."
            restore_docker
            echo ""
            restore_local
            echo ""
            verify_setup
            ;;
        verify)
            verify_setup
            ;;
        help)
            echo "Usage: $0 [docker|local|both|verify|help]"
            echo ""
            echo "Commands:"
            echo "  docker  - Restore Docker environment only"
            echo "  local   - Restore local environment only"
            echo "  both    - Restore both environments (default)"
            echo "  verify  - Verify both environments are working"
            echo "  help    - Show this help message"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac

    log_success "Database restoration process completed!"
    echo ""
    log_info "Next steps:"
    echo "  - For Docker: run 'docker-compose up' to start all services"
    echo "  - For local: run 'cd backend && flask run' to start backend locally"
    echo "  - Access the app at http://localhost:5173 (frontend) and http://localhost:5001 (backend)"
    echo "  - Demo user: demo@example.com / demo123"
}

# Run main function with all arguments
main "$@"
