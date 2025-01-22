#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check if a command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Clean up temporary and build files
cleanup_temp_files() {
    print_header "Cleaning Temporary Files"

    # List of patterns to clean
    patterns=(
        "*.pyc"
        "__pycache__"
        "*.pyo"
        ".pytest_cache"
        "*.coverage"
        ".DS_Store"
        "*.log"
        "*.swp"
        ".env.local"
        "*.bak"
    )

    for pattern in "${patterns[@]}"; do
        find . -name "$pattern" -type f -delete
        find . -name "$pattern" -type d -exec rm -rf {} +
    done

    # Clean specific directories
    rm -rf build/ dist/ *.egg-info/
    rm -rf frontend/build/ frontend/dist/
    rm -rf .coverage htmlcov/
}

# Organize source code
organize_source() {
    print_header "Organizing Source Code"

    # Backend organization
    mkdir -p backend/{app,tests,docs,scripts}
    mkdir -p backend/app/{models,routes,services,utils}
    mkdir -p backend/tests/{unit,integration,e2e}

    # Frontend organization
    mkdir -p frontend/{src,tests,public,docs}
    mkdir -p frontend/src/{components,services,utils,styles}
    mkdir -p frontend/tests/{unit,integration,e2e}
}

# Consolidate documentation
organize_docs() {
    print_header "Organizing Documentation"

    mkdir -p docs/{api,setup,testing,features}

    # Move documentation files to appropriate directories
    mv -f docs/API.md docs/api/README.md 2>/dev/null || true
    mv -f docs/SETUP.md docs/setup/README.md 2>/dev/null || true
    mv -f docs/TEST_PLAN.md docs/testing/TEST_PLAN.md 2>/dev/null || true
}

# Organize test files
organize_tests() {
    print_header "Organizing Tests"

    mkdir -p tests/{unit,integration,e2e,setup}

    # Move test files to appropriate directories
    find . -name "*test*.py" -not -path "./tests/*" -exec mv {} tests/unit/ \; 2>/dev/null || true
    find . -name "*test*.js" -not -path "./tests/*" -exec mv {} tests/unit/ \; 2>/dev/null || true
}

# Clean up node modules
cleanup_node_modules() {
    print_header "Cleaning Node Modules"

    # Remove node_modules and reinstall
    find . -name "node_modules" -type d -exec rm -rf {} +

    # Reinstall in frontend
    if [ -f "frontend/package.json" ]; then
        cd frontend
        npm install
        cd ..
    fi
}

# Clean up Python virtual environments
cleanup_venv() {
    print_header "Cleaning Python Virtual Environments"

    find . -name "venv" -type d -exec rm -rf {} +
    find . -name ".env" -type f -exec rm -f {} +

    # Recreate backend venv
    if [ -f "backend/requirements.txt" ]; then
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        deactivate
        cd ..
    fi
}

# Update gitignore
update_gitignore() {
    print_header "Updating .gitignore"

    cat << EOF > .gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
venv/
.coverage
htmlcov/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
.AppleDouble
.LSOverride
Thumbs.db

# Testing
.pytest_cache/
coverage/
.nyc_output/
cypress/videos/
cypress/screenshots/

# Build
frontend/build/
frontend/dist/
backend/build/
backend/dist/

# Logs
*.log
logs/
log/

# Environment
.env*
!.env.example

# Database
*.sqlite
*.db

# Temporary files
*.tmp
*.temp
*.bak
EOF
}

# Main execution
print_header "Starting Codebase Cleanup"

# Create backup
print_header "Creating Backup"
timestamp=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_${timestamp}.tar.gz" --exclude="node_modules" --exclude="venv" --exclude=".git" .
check_status "Backup creation"

# Run cleanup tasks
cleanup_temp_files
organize_source
organize_docs
organize_tests
cleanup_node_modules
cleanup_venv
update_gitignore

print_header "Cleanup Complete"
echo "A backup of the original codebase is available at: backup_${timestamp}.tar.gz"
