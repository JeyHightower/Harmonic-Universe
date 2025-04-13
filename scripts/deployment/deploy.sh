#!/bin/bash
# deploy.sh - Deploy the Harmonic Universe application to Render.com
# This script handles the deployment process to Render.com

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Print with color
print_green() {
    echo -e "\e[32m$1\e[0m"
}

print_yellow() {
    echo -e "\e[33m$1\e[0m"
}

print_red() {
    echo -e "\e[31m$1\e[0m"
}

# Check if Render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_yellow "Render CLI not found. Using web deployment instructions instead."
    else
        print_green "Render CLI found."
    fi
}

# Build the frontend
build_frontend() {
    print_yellow "Building frontend..."
    cd "$FRONTEND_DIR"
    
    # Run the build command
    npm run build
    
    print_green "Frontend build completed."
}

# Ensure render.yaml is updated
check_render_yaml() {
    if [ ! -f "$ROOT_DIR/render.yaml" ]; then
        print_red "render.yaml not found in project root. Please create it before deploying."
        print_yellow "See the deployment documentation for render.yaml configuration."
        exit 1
    fi
    print_green "render.yaml found."
}

# Deploy using Render CLI if available
deploy_with_cli() {
    if command -v render &> /dev/null; then
        print_yellow "Deploying to Render using CLI..."
        cd "$ROOT_DIR"
        render deploy
        print_green "Deployment initiated via Render CLI."
        return 0
    fi
    return 1
}

# Git-based deployment instructions
show_git_instructions() {
    print_yellow "To deploy via Git:"
    print_yellow "1. Make sure your code is committed to your repository."
    print_yellow "2. Log in to your Render dashboard: https://dashboard.render.com"
    print_yellow "3. Create a new 'Blueprint' and connect your repository."
    print_yellow "4. Render will detect the render.yaml file and set up services."
    print_yellow "5. Click 'Apply' to start the deployment."
}

# Verify build outputs
verify_build() {
    if [ ! -d "$FRONTEND_DIR/dist" ]; then
        print_red "Frontend build directory not found. Build may have failed."
        exit 1
    fi
    print_green "Frontend build verified."
}

# Update environment variables on Render
update_env_vars() {
    print_yellow "Note: To update environment variables on Render:"
    print_yellow "1. Go to your service in the Render dashboard"
    print_yellow "2. Navigate to the 'Environment' tab"
    print_yellow "3. Add or update the necessary variables"
    print_yellow "   - DATABASE_URL: [Your PostgreSQL connection string]"
    print_yellow "   - SECRET_KEY: [Your secret key]"
    print_yellow "   - FLASK_ENV: production"
}

# Main function
main() {
    print_green "==== Deploying Harmonic Universe to Render.com ===="
    
    # Check prerequisites
    check_render_cli
    check_render_yaml
    
    # Build the frontend
    build_frontend
    
    # Verify build outputs
    verify_build
    
    # Try to deploy using Render CLI
    if ! deploy_with_cli; then
        print_yellow "Using manual deployment instructions."
        show_git_instructions
    fi
    
    # Show environment variable instructions
    update_env_vars
    
    print_green "==== Deployment process completed ===="
    print_yellow "Check the Render dashboard for deployment status."
}

# Run main function
main 