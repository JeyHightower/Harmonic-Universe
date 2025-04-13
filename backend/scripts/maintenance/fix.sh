#!/bin/bash

# ======================================
# Harmonic Universe - Fix Script
# ======================================
#
# This script provides fixes for common issues in the Harmonic Universe project.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Function to fix build directory
fix_build_directory() {
    log_info "Fixing build directory..."
    
    # Check if we have a dist or build directory
    cd "$FRONTEND_DIR"
    
    if [ ! -d "dist" ] && [ ! -d "build" ]; then
        log_error "No build directory found. Please build the frontend first."
        return 1
    fi
    
    # Ensure correct build directory
    if [ -d "build" ] && [ ! -d "dist" ]; then
        log_info "Renaming build directory to dist..."
        mv build dist
    fi
    
    # Ensure static directory in backend
    ensure_directory "$BACKEND_DIR/static"
    
    # Copy frontend build to backend static
    log_info "Copying frontend build to backend static..."
    cp -r "$FRONTEND_DIR/dist"/* "$BACKEND_DIR/static/"
    
    log_success "Build directory fixed successfully."
    return 0
}

# Function to fix the React app for production
fix_react_app() {
    log_info "Fixing React app for production..."
    
    # Check for package.json
    cd "$FRONTEND_DIR"
    if [ ! -f "package.json" ]; then
        log_error "Frontend package.json not found."
        return 1
    fi
    
    # Update homepage in package.json if needed
    log_info "Updating package.json..."
    if [ -f "package.json" ]; then
        # Check if homepage is set
        if ! grep -q "\"homepage\":" "package.json"; then
            log_info "Adding homepage to package.json..."
            # Use sed to add homepage before the last closing brace
            sed -i.bak '/"name": "frontend"/a \\  "homepage": "/",\' package.json
            rm -f package.json.bak
        fi
    fi
    
    # Fix index.html base path if needed
    if [ -f "public/index.html" ]; then
        log_info "Checking public/index.html..."
        if ! grep -q "<base href=\"/\">" "public/index.html"; then
            log_info "Adding base tag to index.html..."
            sed -i.bak '/<head>/a \\    <base href="/">' public/index.html
            rm -f public/index.html.bak
        fi
    fi
    
    # Fix vite.config.js if it exists
    if [ -f "vite.config.js" ]; then
        log_info "Checking vite.config.js..."
        if ! grep -q "base:" "vite.config.js"; then
            log_info "Adding base path to vite.config.js..."
            sed -i.bak '/plugins:/i \\  base: "/",\' vite.config.js
            rm -f vite.config.js.bak
        fi
    fi
    
    log_success "React app fixed for production."
    return 0
}

# Function to fix app module
fix_app_module() {
    log_info "Fixing app module..."
    
    # Check for wsgi.py
    cd "$ROOT_DIR"
    if [ ! -f "wsgi.py" ]; then
        log_info "Creating wsgi.py..."
        cat > wsgi.py << EOF
from backend.app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
EOF
    else
        log_info "Updating wsgi.py..."
        cat > wsgi.py << EOF
from backend.app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
EOF
    fi
    
    # Fix app.py
    cd "$BACKEND_DIR"
    if [ -f "app.py" ]; then
        log_info "Checking app.py..."
        
        # Ensure static folder is correctly set
        if ! grep -q "static_folder" "app.py"; then
            log_info "Adding static folder to app.py..."
            sed -i.bak '/Flask(__name__/s/)/, static_folder="static")/' app.py
            rm -f app.py.bak
        fi
    fi
    
    log_success "App module fixed successfully."
    return 0
}

# Function to fix database connections
fix_db_connections() {
    log_info "Fixing database connections..."
    
    # Check for .env file
    cd "$BACKEND_DIR"
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please run setup.sh first."
        return 1
    fi
    
    # Update database connection string
    log_info "Updating database connection string..."
    
    # Source .env file
    source .env
    
    # Create or update database.py
    if [ -f "database.py" ]; then
        log_info "Updating database.py..."
        
        # Check if SQLAlchemy is used
        if grep -q "SQLAlchemy" "database.py"; then
            # Update database connection string
            if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ] && [ -n "$DB_HOST" ]; then
                log_info "Updating SQLAlchemy connection string..."
                cat > database.py << EOF
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
import os

# Get database credentials from environment variables
DB_USER = os.getenv('DB_USER', 'harmonic_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'harmonic_password')
DB_NAME = os.getenv('DB_NAME', 'harmonic_universe')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

# Create database URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine for SQLAlchemy
engine = create_engine(DATABASE_URL)

# Create SQLAlchemy instance
db = SQLAlchemy()

def init_db(app):
    """Initialize the database with the app"""
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
EOF
            fi
        fi
    fi
    
    log_success "Database connections fixed successfully."
    return 0
}

# Function to fix start script
fix_start_script() {
    log_info "Fixing start script..."
    
    # Create start.sh in backend
    cd "$BACKEND_DIR"
    log_info "Creating backend start.sh..."
    cat > start.sh << EOF
#!/bin/bash

# Start backend server
if [ -d "venv" ]; then
    source venv/bin/activate
fi

export FLASK_APP=app.py
export FLASK_ENV=production
export PORT=5001

# Load environment variables
if [ -f ".env.production" ]; then
    export \$(grep -v '^#' .env.production | xargs)
elif [ -f ".env" ]; then
    export \$(grep -v '^#' .env | xargs)
fi

# Start the server
gunicorn wsgi:app --workers 4 --bind 0.0.0.0:\${PORT:-5001}
EOF
    chmod +x start.sh
    
    # Create start.sh in root
    cd "$ROOT_DIR"
    log_info "Creating root start.sh..."
    cat > start.sh << EOF
#!/bin/bash

# Start the application
cd backend
./start.sh
EOF
    chmod +x start.sh
    
    log_success "Start scripts fixed successfully."
    return 0
}

# Function to fix all issues
fix_all() {
    log_info "Fixing all issues..."
    
    # Fix build directory
    fix_build_directory
    
    # Fix React app
    fix_react_app
    
    # Fix app module
    fix_app_module
    
    # Fix database connections
    fix_db_connections
    
    # Fix start script
    fix_start_script
    
    log_success "All issues fixed successfully."
    return 0
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-help}"
    
    case "$command" in
        build)
            fix_build_directory
            ;;
        react)
            fix_react_app
            ;;
        app)
            fix_app_module
            ;;
        db)
            fix_db_connections
            ;;
        start)
            fix_start_script
            ;;
        all)
            fix_all
            ;;
        help)
            log_info "Harmonic Universe Fix Script"
            log_info "Usage: $0 <command>"
            log_info ""
            log_info "Commands:"
            log_info "  build      Fix build directory issues"
            log_info "  react      Fix React app issues"
            log_info "  app        Fix app module issues"
            log_info "  db         Fix database connection issues"
            log_info "  start      Fix start script issues"
            log_info "  all        Fix all issues"
            log_info "  help       Show this help message"
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