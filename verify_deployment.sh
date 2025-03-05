#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== Harmonic Universe Deployment Verification ===${NC}"
echo -e "${CYAN}This script will verify your deployment setup locally${NC}"

# Check if build.sh exists and is executable
if [ -f "build.sh" ] && [ -x "build.sh" ]; then
    echo -e "${GREEN}✓ build.sh exists and is executable${NC}"
else
    echo -e "${RED}✗ build.sh is missing or not executable${NC}"
    echo -e "${YELLOW}Run: chmod +x build.sh${NC}"
    exit 1
fi

# Check if render.yaml exists
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓ render.yaml exists${NC}"
else
    echo -e "${RED}✗ render.yaml is missing${NC}"
    exit 1
fi

# Check if app.py exists
if [ -f "app.py" ]; then
    echo -e "${GREEN}✓ app.py exists${NC}"
else
    echo -e "${RED}✗ app.py is missing${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ -d "frontend" ]; then
    echo -e "${GREEN}✓ frontend directory exists${NC}"
else
    echo -e "${RED}✗ frontend directory is missing${NC}"
    exit 1
fi

# Check if backend directory exists
if [ -d "backend" ]; then
    echo -e "${GREEN}✓ backend directory exists${NC}"
else
    echo -e "${RED}✗ backend directory is missing${NC}"
    exit 1
fi

# Check if backend/requirements.txt exists
if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✓ backend/requirements.txt exists${NC}"
else
    echo -e "${RED}✗ backend/requirements.txt is missing${NC}"
    exit 1
fi

# Check if frontend/package.json exists
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✓ frontend/package.json exists${NC}"
else
    echo -e "${RED}✗ frontend/package.json is missing${NC}"
    exit 1
fi

# Check if the render-build script exists in package.json
if grep -q "render-build" frontend/package.json; then
    echo -e "${GREEN}✓ render-build script exists in package.json${NC}"
else
    echo -e "${RED}✗ render-build script is missing in package.json${NC}"
    exit 1
fi

# Check if static directory exists, create if not
if [ -d "static" ]; then
    echo -e "${GREEN}✓ static directory exists${NC}"
else
    echo -e "${YELLOW}! static directory does not exist, creating it${NC}"
    mkdir -p static
    echo -e "${GREEN}✓ static directory created${NC}"
fi

echo -e "${CYAN}=== Deployment verification completed successfully ===${NC}"
echo -e "${YELLOW}Your application is ready for deployment to Render.com${NC}"
echo -e "${YELLOW}Use the following steps to deploy:${NC}"
echo -e "${YELLOW}1. Push your code to GitHub${NC}"
echo -e "${YELLOW}2. Create a new Web Service in Render.com${NC}"
echo -e "${YELLOW}3. Connect your GitHub repository${NC}"
echo -e "${YELLOW}4. Render will automatically use your render.yaml configuration${NC}"
echo -e "${YELLOW}5. Monitor the deployment logs for any issues${NC}"

exit 0
