#!/bin/bash

# ======================================
# Harmonic Universe - Core Utilities
# ======================================

# Log levels
LOG_LEVEL_INFO=0
LOG_LEVEL_SUCCESS=1
LOG_LEVEL_WARNING=2
LOG_LEVEL_ERROR=3

# Colors
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

# Check if a command exists
check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}
