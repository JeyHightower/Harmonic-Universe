#!/bin/bash

# ======================================
# Harmonic Universe - Utilities
# ======================================
#
# This file contains utility functions for the Harmonic Universe project.

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"

# =====================
# OS-specific utilities
# =====================

# Install dependencies based on OS
install_os_dependencies() {
    log_info "Installing OS dependencies..."
    
    if is_macos; then
        # macOS
        if ! check_command "brew"; then
            log_error "Homebrew not found. Please install Homebrew first."
            log_info "Visit https://brew.sh/ for instructions."
            return 1
        fi
        
        log_info "Installing dependencies with Homebrew..."
        execute_command "brew update" "Updating Homebrew"
        execute_command "brew install python@3.9 node@16 postgresql" "Installing required packages"
    elif is_linux; then
        # Linux
        log_info "Updating package lists..."
        execute_command "sudo apt-get update" "Updating package lists"
        
        log_info "Installing dependencies..."
        execute_command "sudo apt-get install -y python3.9 python3.9-venv python3-pip nodejs npm postgresql postgresql-contrib" "Installing required packages"
    else
        log_error "Unsupported operating system."
        return 1
    fi
    
    log_success "OS dependencies installed successfully."
    return 0
}

# =====================
# Project utilities
# =====================

# Check project prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check for required commands
    local required_commands=("python3" "pip" "node" "npm" "git")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! check_command "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -gt 0 ]; then
        log_error "Missing required commands: ${missing_commands[*]}"
        log_info "Please install the missing requirements before proceeding."
        return 1
    fi
    
    log_success "All prerequisites are installed."
    return 0
}

# =====================
# Database utilities
# =====================

# Initialize database
init_database() {
    local db_name="${1:-harmonic_universe}"
    local db_user="${2:-harmonic_user}"
    local db_password="${3:-harmonic_password}"
    
    log_info "Initializing database: $db_name"
    
    if is_macos; then
        # macOS
        if ! check_command "pg_ctl"; then
            log_error "PostgreSQL command line tools not found."
            return 1
        fi
        
        # Check if PostgreSQL service is running
        if ! pg_ctl status -D /usr/local/var/postgres &>/dev/null; then
            log_info "Starting PostgreSQL service..."
            execute_command "pg_ctl start -D /usr/local/var/postgres" "Starting PostgreSQL"
        fi
    elif is_linux; then
        # Linux
        if ! systemctl is-active --quiet postgresql; then
            log_info "Starting PostgreSQL service..."
            execute_command "sudo systemctl start postgresql" "Starting PostgreSQL"
        fi
    fi
    
    # Create database and user
    log_info "Creating database and user..."
    execute_command "psql -c \"CREATE USER $db_user WITH PASSWORD '$db_password';\" postgres" "Creating database user"
    execute_command "psql -c \"CREATE DATABASE $db_name OWNER $db_user;\" postgres" "Creating database"
    
    log_success "Database initialized successfully."
    return 0
}

# =====================
# Virtual environment utilities
# =====================

# Setup Python virtual environment
setup_python_venv() {
    local venv_dir="${1:-venv}"
    
    log_info "Setting up Python virtual environment: $venv_dir"
    
    if check_venv "$venv_dir"; then
        log_info "Virtual environment already exists. Skipping creation."
    else
        execute_command "python3 -m venv $venv_dir" "Creating virtual environment"
    fi
    
    # Activate virtual environment
    log_info "Activating virtual environment..."
    source "$venv_dir/bin/activate"
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies..."
        execute_command "pip install -r requirements.txt" "Installing Python dependencies"
    else
        log_warning "No requirements.txt file found. Skipping dependency installation."
    fi
    
    log_success "Python virtual environment setup complete."
    return 0
}

# =====================
# Node.js utilities
# =====================

# Install Node.js dependencies
install_node_dependencies() {
    local dir="${1:-.}"
    
    log_info "Installing Node.js dependencies in $dir..."
    
    if ! check_package_json "$dir"; then
        log_error "No package.json found in $dir"
        return 1
    fi
    
    local pm=$(get_package_manager "$dir")
    
    log_info "Using package manager: $pm"
    
    case "$pm" in
        pnpm)
            execute_command "cd $dir && pnpm install" "Installing dependencies with pnpm"
            ;;
        yarn)
            execute_command "cd $dir && yarn install" "Installing dependencies with yarn"
            ;;
        npm)
            execute_command "cd $dir && npm install" "Installing dependencies with npm"
            ;;
        *)
            log_error "Unknown package manager: $pm"
            return 1
            ;;
    esac
    
    log_success "Node.js dependencies installed successfully."
    return 0
}

# =====================
# Backup utilities
# =====================

# Create backup
create_backup() {
    local backup_dir="backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/backup_$timestamp.tar.gz"
    
    log_info "Creating backup: $backup_file"
    
    # Ensure backup directory exists
    ensure_directory "$backup_dir"
    
    # Create tarball excluding node_modules, venv, etc.
    execute_command "tar --exclude='node_modules' --exclude='venv' --exclude='__pycache__' --exclude='.git' -czf $backup_file ." "Creating backup archive"
    
    log_success "Backup created: $backup_file"
    return 0
}

# Restore backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified."
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warning "Restoring backup will overwrite current project files."
    if ! confirm "Do you want to continue?"; then
        log_info "Backup restore cancelled."
        return 0
    fi
    
    log_info "Restoring backup: $backup_file"
    
    # Create a temporary directory for extraction
    local temp_dir="temp_restore"
    ensure_directory "$temp_dir"
    
    # Extract backup
    execute_command "tar -xzf $backup_file -C $temp_dir" "Extracting backup"
    
    # Copy files from temp directory
    execute_command "cp -R $temp_dir/* ." "Copying files from backup"
    
    # Clean up
    execute_command "rm -rf $temp_dir" "Cleaning up"
    
    log_success "Backup restored successfully."
    return 0
}

# Check if package.json exists
check_package_json() {
    dir="$1"
    
    if [ -f "$dir/package.json" ]; then
        log_debug "package.json found in: $dir"
        return 0
    else
        log_debug "package.json not found in: $dir"
        return 1
    fi
} 