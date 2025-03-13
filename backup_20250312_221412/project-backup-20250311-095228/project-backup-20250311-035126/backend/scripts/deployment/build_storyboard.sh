#!/bin/bash

# Build script for storyboard functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting storyboard build process...${NC}"

# Check if environment variables are set
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=development
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf frontend/build
rm -rf backend/dist

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend dependency installation failed${NC}"
    exit 1
fi

# Build frontend
echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend build failed${NC}"
    exit 1
fi

# Run frontend tests
echo "Running frontend tests..."
npm test -- --watchAll=false
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend tests failed${NC}"
    exit 1
fi

# Run frontend linting
echo "Running frontend linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend linting failed${NC}"
    exit 1
fi
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend dependency installation failed${NC}"
    exit 1
fi

# Run backend tests
echo "Running backend tests..."
pytest tests/
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend tests failed${NC}"
    exit 1
fi

# Run backend linting
echo "Running backend linting..."
flake8 .
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend linting failed${NC}"
    exit 1
fi

# Build backend
echo "Building backend..."
python setup.py build
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend build failed${NC}"
    exit 1
fi
cd ..

# Build documentation
echo "Building documentation..."
cd docs
mkdocs build
if [ $? -ne 0 ]; then
    echo -e "${RED}Documentation build failed${NC}"
    exit 1
fi
cd ..

# Create distribution package
echo "Creating distribution package..."
mkdir -p dist
cp -r frontend/build dist/frontend
cp -r backend/dist dist/backend
cp -r docs/site dist/docs

# Generate build report
echo "Generating build report..."
cat << EOF > dist/build_report.txt
Build Report
===========
Date: $(date)
Environment: $NODE_ENV
Frontend Version: $(node -p "require('./frontend/package.json').version")
Backend Version: $(python -c "import backend; print(backend.__version__)")

Build Status:
- Frontend: Success
- Backend: Success
- Documentation: Success

Test Results:
- Frontend Tests: Passed
- Backend Tests: Passed
- Linting: Passed
EOF

echo -e "${GREEN}Storyboard build complete!${NC}"
echo -e "${YELLOW}Build artifacts are available in the dist/ directory${NC}"
echo -e "${YELLOW}Please check build_report.txt for details${NC}"
