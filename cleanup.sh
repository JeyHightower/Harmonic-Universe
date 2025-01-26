#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting project cleanup...${NC}"

# Function to safely remove files/directories
safe_remove() {
    if [ -e "$1" ]; then
        rm -rf "$1"
        echo -e "${GREEN}✓ Removed: $1${NC}"
    fi
}

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${GREEN}✓ Created directory: $1${NC}"
    fi
}

# Clean frontend
echo -e "\n${YELLOW}Cleaning frontend...${NC}"
cd frontend

# Remove build artifacts and temporary files
safe_remove "node_modules"
safe_remove "dist"
safe_remove "coverage"
safe_remove ".cache"
safe_remove "*.log"

# Organize frontend structure
ensure_directory "src/components"
ensure_directory "src/pages"
ensure_directory "src/store"
ensure_directory "src/services"
ensure_directory "src/utils"
ensure_directory "src/assets"
ensure_directory "src/styles"
ensure_directory "src/hooks"
ensure_directory "src/types"
ensure_directory "src/tests"

cd ..

# Clean backend
echo -e "\n${YELLOW}Cleaning backend...${NC}"
cd backend

# Remove Python cache and temporary files
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.pyd" -delete
find . -type f -name ".coverage" -delete
find . -type d -name ".pytest_cache" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +

# Remove virtual environment
safe_remove "venv"
safe_remove "env"

# Organize backend structure
ensure_directory "app"
ensure_directory "tests"
ensure_directory "migrations"
ensure_directory "models"
ensure_directory "routes"
ensure_directory "services"
ensure_directory "utils"
ensure_directory "config"

cd ..

# Clean root directory
echo -e "\n${YELLOW}Cleaning root directory...${NC}"

# Remove common temporary files and directories
safe_remove ".DS_Store"
find . -name ".DS_Store" -delete
safe_remove "*.log"
safe_remove "tmp"
safe_remove ".tmp"
safe_remove ".temp"

# Organize root structure
ensure_directory "docs"
ensure_directory "scripts"
ensure_directory "config"

# Final cleanup report
echo -e "\n${YELLOW}Cleanup Summary:${NC}"
echo -e "${GREEN}✓ Frontend cleaned and organized${NC}"
echo -e "${GREEN}✓ Backend cleaned and organized${NC}"
echo -e "${GREEN}✓ Root directory cleaned and organized${NC}"

echo -e "\n${YELLOW}Project structure has been cleaned and organized.${NC}"
echo -e "${YELLOW}Please review the changes and commit if satisfied.${NC}"
