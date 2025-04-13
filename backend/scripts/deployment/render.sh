#!/bin/bash

# ======================================
# Harmonic Universe - Render Utilities
# ======================================
#
# This script provides utilities for Render deployment.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Function to create render.yaml
create_render_yaml() {
    log_info "Creating render.yaml..."
    
    cd "$ROOT_DIR"
    
    # Create render.yaml
    cat > render.yaml << EOF
services:
  # Backend service
  - type: web
    name: harmonic-universe-api
    env: python
    buildCommand: ./render-build.sh
    startCommand: ./render-start.sh
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.1
      - key: FLASK_APP
        value: app.py
      - key: FLASK_ENV
        value: production
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: harmonic-universe-db
          property: connectionString

  # Frontend service
  - type: web
    name: harmonic-universe-web
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  - name: harmonic-universe-db
    databaseName: harmonic_universe
    user: harmonic_user
EOF
    
    log_success "render.yaml created successfully."
    return 0
}

# Function to create render-build.sh
create_render_build() {
    log_info "Creating render-build.sh..."
    
    cd "$ROOT_DIR"
    
    # Create render-build.sh
    cat > render-build.sh << EOF
#!/usr/bin/env bash
# Exit on error
set -e

# Build frontend
cd frontend
npm install
npm run build

# Create static directory
mkdir -p ../backend/static

# Copy frontend build to backend/static
cp -r dist/* ../backend/static/

# Build backend
cd ../backend
pip install -U pip
pip install -r requirements.txt

# Install production dependencies
pip install gunicorn psycopg2-binary

# Initialize database
flask db upgrade
EOF
    
    # Make executable
    chmod +x render-build.sh
    
    log_success "render-build.sh created successfully."
    return 0
}

# Function to create render-start.sh
create_render_start() {
    log_info "Creating render-start.sh..."
    
    cd "$ROOT_DIR"
    
    # Create render-start.sh
    cat > render-start.sh << EOF
#!/usr/bin/env bash
# Exit on error
set -e

# Start the application
cd backend
gunicorn wsgi:app --workers=4 --bind=0.0.0.0:\${PORT:-5000}
EOF
    
    # Make executable
    chmod +x render-start.sh
    
    log_success "render-start.sh created successfully."
    return 0
}

# Function to prepare for Render deployment
prepare_render() {
    log_info "Preparing for Render deployment..."
    
    # Create render.yaml
    create_render_yaml
    
    # Create render-build.sh
    create_render_build
    
    # Create render-start.sh
    create_render_start
    
    # Create wsgi.py if it doesn't exist
    if [ ! -f "$ROOT_DIR/wsgi.py" ]; then
        log_info "Creating wsgi.py..."
        cat > "$ROOT_DIR/wsgi.py" << EOF
from backend.app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
EOF
    fi
    
    log_success "Render deployment preparation completed successfully."
    return 0
}

# Function to check Render deployment
check_render() {
    log_info "Checking Render deployment files..."
    
    # Check for required files
    local missing_files=()
    
    if [ ! -f "$ROOT_DIR/render.yaml" ]; then
        missing_files+=("render.yaml")
    fi
    
    if [ ! -f "$ROOT_DIR/render-build.sh" ]; then
        missing_files+=("render-build.sh")
    fi
    
    if [ ! -f "$ROOT_DIR/render-start.sh" ]; then
        missing_files+=("render-start.sh")
    fi
    
    if [ ! -f "$ROOT_DIR/wsgi.py" ]; then
        missing_files+=("wsgi.py")
    fi
    
    # Report missing files
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_warning "Missing Render deployment files: ${missing_files[*]}"
        log_info "Use '$0 prepare' to create these files."
        return 1
    else
        log_success "All required Render deployment files found."
    fi
    
    # Validate render.yaml
    if [ -f "$ROOT_DIR/render.yaml" ]; then
        if ! grep -q "harmonic-universe-api" "$ROOT_DIR/render.yaml"; then
            log_warning "render.yaml may be invalid. Consider recreating it with '$0 yaml'."
            return 1
        fi
    fi
    
    log_success "Render deployment check completed successfully."
    return 0
}

# Function to deploy to Render
deploy_to_render() {
    log_info "Deploying to Render..."
    
    # Check deployment files
    check_render
    if [ $? -ne 0 ]; then
        if confirm "Some Render deployment files are missing. Do you want to create them?"; then
            prepare_render
        else
            log_error "Render deployment preparation skipped. Aborting deployment."
            return 1
        fi
    fi
    
    # Check if render CLI is installed
    if ! check_command "render"; then
        log_warning "Render CLI not found. Using manual deployment."
        log_info "Please use the Render dashboard to deploy your application."
        log_info "Visit https://dashboard.render.com to deploy."
        return 0
    fi
    
    # Deploy using Render CLI
    log_info "Deploying using Render CLI..."
    execute_command "render deploy" "Deploying to Render"
    
    log_success "Deployment to Render initiated."
    log_info "Check your Render dashboard for deployment status."
    
    return 0
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-help}"
    
    case "$command" in
        yaml)
            create_render_yaml
            ;;
        build)
            create_render_build
            ;;
        start)
            create_render_start
            ;;
        prepare)
            prepare_render
            ;;
        check)
            check_render
            ;;
        deploy)
            deploy_to_render
            ;;
        help)
            log_info "Harmonic Universe Render Utilities"
            log_info "Usage: $0 <command>"
            log_info ""
            log_info "Commands:"
            log_info "  yaml       Create render.yaml"
            log_info "  build      Create render-build.sh"
            log_info "  start      Create render-start.sh"
            log_info "  prepare    Prepare all Render deployment files"
            log_info "  check      Check Render deployment files"
            log_info "  deploy     Deploy to Render"
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