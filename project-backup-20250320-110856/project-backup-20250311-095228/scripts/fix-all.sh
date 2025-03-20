#!/bin/bash
# Fix all script for Harmonic Universe
# This script fixes common issues with the application

# Print colorful messages
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}Starting comprehensive fix for Harmonic Universe...${NC}"

# Make sure all scripts are executable
echo "${YELLOW}Making scripts executable...${NC}"
chmod +x run.py setup_path.py frontend/scripts/fix-vite-deps.js
[ -f backend/run.py ] && chmod +x backend/run.py

# Kill any existing Flask processes
echo "${YELLOW}Checking for existing Flask processes...${NC}"
pkill -f "python run.py" || true
pkill -f "flask run" || true

# Fix frontend Vite dependencies
echo "${YELLOW}Fixing frontend Vite dependencies...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    if [ -d "scripts" ]; then
        echo "${YELLOW}Running fix-vite-deps.js...${NC}"
        [ -f "scripts/fix-vite-deps.js" ] && node scripts/fix-vite-deps.js
    else
        echo "${RED}Frontend scripts directory not found!${NC}"
    fi
    cd ..
else
    echo "${RED}Frontend directory not found!${NC}"
fi

# Fix backend imports
echo "${YELLOW}Fixing backend import paths...${NC}"
if [ -f "setup_path.py" ]; then
    echo "${YELLOW}Running setup_path.py...${NC}"
    python setup_path.py
else
    echo "${RED}setup_path.py not found!${NC}"
fi

# Try to run the app with improved port handling
echo "${YELLOW}Testing application startup...${NC}"
if [ -f "run.py" ]; then
    echo "${YELLOW}Running application with timeout...${NC}"
    timeout 5 python run.py &
    PID=$!
    sleep 5
    kill $PID 2>/dev/null || true
    echo "${GREEN}Application startup test completed${NC}"
else
    echo "${RED}run.py not found!${NC}"
fi

echo "${GREEN}All fixes have been applied!${NC}"
echo "${GREEN}You can now start the application with:${NC}"
echo "  python run.py           # For the main application"
echo "  cd backend && python run.py    # For backend only"
echo "  cd frontend && npm run dev     # For frontend only"
echo "  npm run dev             # For both frontend and backend"
