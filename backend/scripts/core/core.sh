#!/bin/bash

# ======================================
# Harmonic Universe - Core Utilities
# ======================================
#
# This file contains core utilities used by all scripts
# in the Harmonic Universe project.

# =====================
# Logging Functions
# =====================

# Define log levels
LOG_LEVEL_DEBUG=0
LOG_LEVEL_INFO=1
LOG_LEVEL_SUCCESS=2
LOG_LEVEL_WARNING=3
LOG_LEVEL_ERROR=4

# Default log level
CURRENT_LOG_LEVEL=$LOG_LEVEL_INFO

# Colors
COLOR_RESET="\033[0m"
COLOR_RED="\033[0;31m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[0;33m"
COLOR_BLUE="\033[0;34m"
COLOR_PURPLE="\033[0;35m"
COLOR_CYAN="\033[0;36m"
COLOR_WHITE="\033[0;37m"
COLOR_BOLD="\033[1m"

# Print success message
log_success() {
    if [ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_SUCCESS ]; then
        echo -e "${COLOR_GREEN}✓ $1${COLOR_RESET}"
    fi
}

# Print info message
log_info() {
    if [ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_INFO ]; then
        echo -e "${COLOR_BLUE}ℹ $1${COLOR_RESET}"
    fi
}

# Print debug message
log_debug() {
    if [ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_DEBUG ]; then
        echo -e "${COLOR_CYAN}🔍 $1${COLOR_RESET}"
    fi
}

# Print warning message
log_warning() {
    if [ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_WARNING ]; then
        echo -e "${COLOR_YELLOW}⚠ $1${COLOR_RESET}"
    fi
}

# Print error message
log_error() {
    if [ $CURRENT_LOG_LEVEL -le $LOG_LEVEL_ERROR ]; then
        echo -e "${COLOR_RED}✗ $1${COLOR_RESET}" >&2
    fi
}

# Print banner
print_banner() {
    echo -e "${COLOR_PURPLE}${COLOR_BOLD}"
    echo "╔═════════════════════════════════════════════════════════════════╗"
    echo "║                     Harmonic Universe                           ║"
    echo "╚═════════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
}

# =====================
# File System Functions
# =====================

# Ensure directory exists
ensure_directory() {
    if [ ! -d "$1" ]; then
        log_debug "Creating directory: $1"
        mkdir -p "$1"
    else
        log_debug "Directory already exists: $1"
    fi
}

# Set permissions for a file
set_permissions() {
    file="$1"
    permissions="$2"
    
    if [ ! -f "$file" ]; then
        log_error "File not found: $file"
        return 1
    fi
    
    log_debug "Setting permissions $permissions for $file"
    chmod "$permissions" "$file"
    return 0
}

# Create file with default contents
create_file() {
    file="$1"
    contents="$2"
    
    if [ -f "$file" ]; then
        log_debug "File already exists: $file"
        return 0
    fi
    
    log_debug "Creating file: $file"
    echo "$contents" > "$file"
    return 0
}

# =====================
# Command Execution
# =====================

# Execute command with logging
execute_command() {
    command="$1"
    description="${2:-Executing command}"
    
    log_debug "$description: $command"
    
    # Execute command and capture output
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        log_error "Command failed with exit code $exit_code"
        log_error "Command: $command"
        log_error "Output: $output"
        return $exit_code
    else
        log_debug "Command executed successfully"
        log_debug "Output: $output"
        return 0
    fi
}

# =====================
# Environment Checks
# =====================

# Check if a command exists
check_command() {
    command="$1"
    
    if command -v "$command" &>/dev/null; then
        log_debug "Command found: $command"
        return 0
    else
        log_debug "Command not found: $command"
        return 1
    fi
}

# Get script directory path
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
}

# Get project root directory
get_root_dir() {
    local script_dir=$(get_script_dir)
    echo "$(dirname "$script_dir")"
}

# Detect OS type
is_macos() {
    [[ "$(uname)" == "Darwin" ]]
}

is_linux() {
    [[ "$(uname)" == "Linux" ]]
}

is_windows() {
    [[ "$(uname)" == *"MINGW"* ]] || [[ "$(uname)" == *"MSYS"* ]]
}

# Check if PNPM is available
has_pnpm() {
    command -v pnpm &>/dev/null
}

# Check for package manager preference
get_package_manager() {
    local dir="$1"
    
    # Default to pnpm if available, otherwise npm
    local default_pm="npm"
    if has_pnpm; then
        default_pm="pnpm"
    fi
    
    # Check for lock files to determine package manager
    if [ -f "$dir/pnpm-lock.yaml" ]; then
        echo "pnpm"
    elif [ -f "$dir/yarn.lock" ]; then
        echo "yarn"
    elif [ -f "$dir/package-lock.json" ]; then
        echo "npm"
    else
        echo "$default_pm"
    fi
}

# Ask user for confirmation
confirm() {
    message="$1"
    default="${2:-y}"
    
    if [ "$default" = "y" ]; then
        prompt="[Y/n]"
    else
        prompt="[y/N]"
    fi
    
    read -r -p "$message $prompt " response
    response="${response,,}" # Convert to lowercase
    
    if [ -z "$response" ]; then
        response="$default"
    fi
    
    [[ "$response" =~ ^(yes|y)$ ]]
} 

# Check for virtual environment (Python)
check_myenv() {
    local myenv_dir="$1"
    
    if [ -d "$myenv_dir" ] && [ -f "$myenv_dir/bin/python" ]; then
        log_debug "Virtual environment found: $myenv_dir"
        return 0
    else
        log_debug "Virtual environment not found: $myenv_dir"
        return 1
    fi
}

# Source core utilities
source_core_utils() {
    local scripts_dir=$(get_script_dir)
    local core_script="$scripts_dir/core.sh"
    
    if [ -f "$core_script" ]; then
        log_debug "Sourcing core utilities from $core_script"
        source "$core_script"
    else
        log_error "Core utilities script not found: $core_script"
        exit 1
    fi
} 