#!/bin/bash
# Common utilities for all scripts

# Exit on error
set -e

# Function to log messages with timestamp
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to ensure a directory exists
ensure_dir() {
  mkdir -p "$1"
}

# Function to check for required environment variables
check_env() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    log "ERROR: Environment variable $var_name is not set!"
    return 1
  fi
  return 0
}
