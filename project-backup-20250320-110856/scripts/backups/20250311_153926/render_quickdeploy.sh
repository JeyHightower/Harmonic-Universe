#!/bin/bash

# ==========================================
# Harmonic Universe - Render.com Deployment Script
# ==========================================

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}    HARMONIC UNIVERSE - RENDER.COM DEPLOYMENT     ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Function to copy to clipboard
copy_to_clipboard() {
  if [ "$(uname)" == "Darwin" ]; then
    echo "$1" | pbcopy
    echo -e "${GREEN}✓ Copied to clipboard!${NC}"
  elif [ -x "$(command -v xclip)" ]; then
    echo "$1" | xclip -selection clipboard
    echo -e "${GREEN}✓ Copied to clipboard!${NC}"
  elif [ -x "$(command -v clip)" ]; then
    echo "$1" | clip
    echo -e "${GREEN}✓ Copied to clipboard!${NC}"
  else
    echo -e "${YELLOW}⚠ Unable to copy to clipboard automatically. Please copy the command manually.${NC}"
  fi
}

echo -e "\n${YELLOW}This script will help you update your Render.com deployment.${NC}"
echo -e "You'll need to copy these commands to your Render.com dashboard.\n"

echo -e "${BLUE}=== STEP 1: BUILD COMMAND ===${NC}"
echo -e "Copy this to the 'Build Command' field in your Render.com settings:"
echo -e "${GREEN}----------------------------------------${NC}"

BUILD_COMMAND="# Build frontend
if [ -d \"frontend\" ]; then
  cd frontend && npm install && npm run build && cd ..
else
  echo \"Frontend directory not found, skipping frontend build\"
fi

# Build backend - use more resilient approach
python -m pip install --upgrade pip

# Check if requirements.txt exists and install dependencies
if [ -f \"backend/requirements.txt\" ]; then
  python -m pip install -r backend/requirements.txt
elif [ -f \"requirements.txt\" ]; then
  python -m pip install -r requirements.txt
else
  echo \"WARNING: No requirements.txt found!\"
fi

# Install core dependencies explicitly
python -m pip install flask flask_sqlalchemy flask_migrate gunicorn==21.2.0 psycopg2

# Show installed packages for debugging
echo \"Installed packages:\"
python -m pip list

# Set PYTHONPATH and run Flask commands (avoiding directory changes)
export PYTHONPATH=\$PYTHONPATH:\$(pwd)

# Run Flask commands if the Flask application is found
if python -c \"import flask\" 2>/dev/null; then
  echo \"Running database migrations...\"
  python -m flask db upgrade
  echo \"Running database seed...\"
  python -m flask seed all
else
  echo \"WARNING: Flask not found, skipping database operations\"
fi"

echo "$BUILD_COMMAND"
echo -e "${GREEN}----------------------------------------${NC}"
echo -e "Press Enter to copy this Build Command to clipboard..."
read
copy_to_clipboard "$BUILD_COMMAND"

echo -e "\n${BLUE}=== STEP 2: START COMMAND ===${NC}"
echo -e "Copy this to the 'Start Command' field in your Render.com settings:"
echo -e "${GREEN}----------------------------------------${NC}"

START_COMMAND="gunicorn backend.app.main:app --log-level debug"

echo "$START_COMMAND"
echo -e "${GREEN}----------------------------------------${NC}"
echo -e "Press Enter to copy this Start Command to clipboard..."
read
copy_to_clipboard "$START_COMMAND"

echo -e "\n${BLUE}=== STEP 3: DEPLOY ===${NC}"
echo -e "After updating both commands in your Render.com dashboard:"
echo -e "1. Click 'Save Changes'"
echo -e "2. Return to the main service page"
echo -e "3. Click 'Manual Deploy' > 'Clear build cache & deploy'"

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${GREEN}Deployment instructions complete! Good luck!${NC}"
echo -e "${BLUE}==================================================${NC}"
