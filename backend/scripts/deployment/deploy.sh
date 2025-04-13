#!/bin/bash

# ======================================
# Harmonic Universe - Deployment Script
# ======================================
#
# This script deploys the Harmonic Universe project to a production environment.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Default deployment settings
DEPLOY_TARGET="${DEPLOY_TARGET:-render}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DEPLOY_DIR="deploy_$TIMESTAMP"
CURRENT_LINK="current"
BACKUP_LINK="previous"

# Function to deploy to Render
deploy_to_render() {
    log_info "Deploying to Render..."
    
    # Check if render.yaml exists
    if [ ! -f "$ROOT_DIR/render.yaml" ]; then
        log_error "render.yaml not found. Please create it first."
        return 1
    fi
    
    # Check if we have render-cli installed
    if ! check_command "render"; then
        log_warning "Render CLI not found. Using manual deployment."
        log_info "Please use the Render dashboard to deploy your application."
        log_info "Visit https://dashboard.render.com to deploy."
        return 0
    fi
    
    # Deploy using Render CLI
    log_info "Deploying using Render CLI..."
    execute_command "render deploy --local" "Deploying to Render"
    
    log_success "Deployment to Render initiated."
    log_info "Check your Render dashboard for deployment status."
    
    return 0
}

# Function to deploy to a server
deploy_to_server() {
    local server="$1"
    local username="$2"
    local deploy_path="$3"
    
    if [ -z "$server" ] || [ -z "$username" ] || [ -z "$deploy_path" ]; then
        log_error "Server, username, and deploy path are required for server deployment."
        log_info "Usage: $0 server <server> <username> <deploy_path>"
        return 1
    fi
    
    log_info "Deploying to server: $server..."
    
    # Build the project
    log_info "Building project..."
    "$SCRIPT_DIR/build.sh" all
    if [ $? -ne 0 ]; then
        log_error "Build failed. Aborting deployment."
        return 1
    fi
    
    # Create deployment package
    log_info "Creating deployment package..."
    local deploy_package="$ROOT_DIR/deploy_package_$TIMESTAMP.tar.gz"
    
    # Create temporary directory
    local temp_dir="$ROOT_DIR/temp_deploy"
    ensure_directory "$temp_dir"
    
    # Copy backend files
    log_info "Copying backend files..."
    cp -r "$BACKEND_DIR"/* "$temp_dir/"
    
    # Copy frontend build
    if [ -d "$FRONTEND_DIR/dist" ]; then
        log_info "Copying frontend build (dist)..."
        mkdir -p "$temp_dir/static"
        cp -r "$FRONTEND_DIR/dist"/* "$temp_dir/static/"
    elif [ -d "$FRONTEND_DIR/build" ]; then
        log_info "Copying frontend build (build)..."
        mkdir -p "$temp_dir/static"
        cp -r "$FRONTEND_DIR/build"/* "$temp_dir/static/"
    else
        log_error "Frontend build not found. Aborting deployment."
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Create deployment package
    log_info "Creating tar archive..."
    execute_command "tar -czf $deploy_package -C $temp_dir ." "Creating deployment package"
    
    # Clean up temporary directory
    rm -rf "$temp_dir"
    
    # Deploy to server
    log_info "Deploying to server..."
    
    # Create deployment directory on server
    execute_command "ssh $username@$server \"mkdir -p $deploy_path/$DEPLOY_DIR\"" "Creating deployment directory"
    
    # Copy deployment package
    execute_command "scp $deploy_package $username@$server:$deploy_path/$DEPLOY_DIR/package.tar.gz" "Copying deployment package"
    
    # Extract package
    execute_command "ssh $username@$server \"cd $deploy_path/$DEPLOY_DIR && tar -xzf package.tar.gz && rm package.tar.gz\"" "Extracting deployment package"
    
    # Backup current deployment
    execute_command "ssh $username@$server \"cd $deploy_path && [ -L $CURRENT_LINK ] && rm -f $BACKUP_LINK && mv $CURRENT_LINK $BACKUP_LINK || true\"" "Backing up current deployment"
    
    # Update symlink
    execute_command "ssh $username@$server \"cd $deploy_path && ln -sf $DEPLOY_DIR $CURRENT_LINK\"" "Updating symlink"
    
    # Restart application
    execute_command "ssh $username@$server \"cd $deploy_path/$CURRENT_LINK && [ -f start.sh ] && ./start.sh || true\"" "Restarting application"
    
    # Clean up local deployment package
    rm -f "$deploy_package"
    
    log_success "Deployment to server completed successfully."
    return 0
}

# Function to deploy locally
deploy_locally() {
    log_info "Deploying locally..."
    
    # Build the project
    log_info "Building project..."
    "$SCRIPT_DIR/build.sh" all
    if [ $? -ne 0 ]; then
        log_error "Build failed. Aborting deployment."
        return 1
    fi
    
    # Create deployment directory
    local deploy_path="$ROOT_DIR/deployments"
    ensure_directory "$deploy_path"
    ensure_directory "$deploy_path/$DEPLOY_DIR"
    
    # Copy backend files
    log_info "Copying backend files..."
    cp -r "$BACKEND_DIR"/* "$deploy_path/$DEPLOY_DIR/"
    
    # Copy frontend build
    if [ -d "$FRONTEND_DIR/dist" ]; then
        log_info "Copying frontend build (dist)..."
        mkdir -p "$deploy_path/$DEPLOY_DIR/static"
        cp -r "$FRONTEND_DIR/dist"/* "$deploy_path/$DEPLOY_DIR/static/"
    elif [ -d "$FRONTEND_DIR/build" ]; then
        log_info "Copying frontend build (build)..."
        mkdir -p "$deploy_path/$DEPLOY_DIR/static"
        cp -r "$FRONTEND_DIR/build"/* "$deploy_path/$DEPLOY_DIR/static/"
    else
        log_error "Frontend build not found. Aborting deployment."
        rm -rf "$deploy_path/$DEPLOY_DIR"
        return 1
    fi
    
    # Backup current deployment
    if [ -L "$deploy_path/$CURRENT_LINK" ]; then
        log_info "Backing up current deployment..."
        rm -f "$deploy_path/$BACKUP_LINK"
        mv "$deploy_path/$CURRENT_LINK" "$deploy_path/$BACKUP_LINK"
    fi
    
    # Update symlink
    log_info "Updating symlink..."
    ln -sf "$DEPLOY_DIR" "$deploy_path/$CURRENT_LINK"
    
    # Start application
    if [ -f "$deploy_path/$CURRENT_LINK/start.sh" ]; then
        log_info "Starting application..."
        cd "$deploy_path/$CURRENT_LINK" && ./start.sh
    else
        log_warning "No start script found. Please start the application manually."
        log_info "cd $deploy_path/$CURRENT_LINK && python app.py"
    fi
    
    log_success "Local deployment completed successfully."
    return 0
}

# Main function
main() {
    print_banner
    
    # Process command line arguments
    local command="${1:-render}"
    local arg1="$2"
    local arg2="$3"
    local arg3="$4"
    
    case "$command" in
        render)
            deploy_to_render
            ;;
        server)
            deploy_to_server "$arg1" "$arg2" "$arg3"
            ;;
        local)
            deploy_locally
            ;;
        help)
            log_info "Harmonic Universe Deployment Script"
            log_info "Usage: $0 <command> [args]"
            log_info ""
            log_info "Commands:"
            log_info "  render                  Deploy to Render"
            log_info "  server <server> <username> <path>"
            log_info "                          Deploy to a server via SSH"
            log_info "  local                   Deploy locally"
            log_info "  help                    Show this help message"
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