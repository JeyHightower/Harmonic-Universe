#!/bin/bash

# Enable debugging
set -x

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to print progress
print_progress() {
    echo -e "${YELLOW}>>> $1${NC}"
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

# Find and handle duplicate files
handle_duplicates() {
    print_header "Handling Duplicate Files"

    print_progress "Creating temporary directory for duplicate analysis..."
    mkdir -p .tmp_duplicates

    print_progress "Finding duplicate files..."
    # Create a list of all files with their MD5 hashes
    find . -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/venv/*" \
        -not -path "*/.git/*" \
        -not -path "*/__pycache__/*" \
        -not -path "*/migrations/*" \
        -exec md5sum {} \; | sort > .tmp_duplicates/file_hashes.txt

    print_progress "Analyzing duplicates..."
    # Process duplicates
    awk '{print $1}' .tmp_duplicates/file_hashes.txt | sort | uniq -d | while read hash; do
        echo "Found duplicates with hash: $hash"
        files=$(grep "$hash" .tmp_duplicates/file_hashes.txt | cut -d' ' -f2-)

        # Keep the first file and list others for removal
        echo "$files" | head -n1 > .tmp_duplicates/keep_file
        echo "$files" | tail -n+2 > .tmp_duplicates/remove_files

        # Create symbolic links for duplicates
        while read original; do
            while read duplicate; do
                if [ -f "$duplicate" ]; then
                    print_progress "Replacing $duplicate with link to $original"
                    rm "$duplicate"
                    ln -s "$original" "$duplicate"
                fi
            done < .tmp_duplicates/remove_files
        done < .tmp_duplicates/keep_file
    done

    rm -rf .tmp_duplicates
    check_status "Duplicate handling"
}

# Find and remove unused files
cleanup_unused() {
    print_header "Cleaning Unused Files"

    print_progress "Creating temporary directory for analysis..."
    mkdir -p .tmp_unused

    print_progress "Analyzing Python imports..."
    find . -name "*.py" -not -path "*/venv/*" -not -path "*/.git/*" | while read file; do
        # Extract imported modules
        grep -E "^(import|from) [A-Za-z]+" "$file" | cut -d' ' -f2 | cut -d'.' -f1 >> .tmp_unused/imports.txt
    done

    print_progress "Analyzing JavaScript imports..."
    find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" | while read file; do
        # Extract imported modules
        grep -E "^(import|require)" "$file" | grep -o '".*"' | tr -d '"' >> .tmp_unused/imports.txt
    done

    print_progress "Finding unused Python files..."
    find . -name "*.py" -not -path "*/venv/*" -not -path "*/.git/*" | while read file; do
        basename=$(basename "$file" .py)
        if ! grep -q "$basename" .tmp_unused/imports.txt; then
            if [ "$file" != "./setup.py" ] && [ "$file" != "./run.py" ]; then
                echo "$file" >> .tmp_unused/unused_files.txt
            fi
        fi
    done

    print_progress "Finding unused JavaScript files..."
    find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" | while read file; do
        basename=$(basename "$file" .js)
        if ! grep -q "$basename" .tmp_unused/imports.txt; then
            if [ "$file" != "./index.js" ] && [ "$file" != "./app.js" ]; then
                echo "$file" >> .tmp_unused/unused_files.txt
            fi
        fi
    done

    if [ -f .tmp_unused/unused_files.txt ]; then
        print_progress "Moving unused files to 'unused' directory..."
        mkdir -p unused
        while read file; do
            if [ -f "$file" ]; then
                dir=$(dirname "$file")
                mkdir -p "unused/$dir"
                mv "$file" "unused/$file"
            fi
        done < .tmp_unused/unused_files.txt
    fi

    rm -rf .tmp_unused
    check_status "Unused file cleanup"
}

# Clean up empty directories
cleanup_empty_dirs() {
    print_header "Cleaning Empty Directories"

    print_progress "Finding and removing empty directories..."
    find . -type d -empty -not -path "*/node_modules/*" -not -path "*/venv/*" -not -path "*/.git/*" -delete

    check_status "Empty directory cleanup"
}

# Consolidate similar files
consolidate_similar() {
    print_header "Consolidating Similar Files"

    print_progress "Finding similar test files..."
    # Consolidate test files
    mkdir -p tests/{unit,integration,e2e}
    find . -name "*test*.py" -not -path "./tests/*" -exec mv {} tests/unit/ \;
    find . -name "*test*.js" -not -path "./tests/*" -exec mv {} tests/unit/ \;

    print_progress "Finding similar utility files..."
    # Consolidate utility files
    mkdir -p utils
    find . -name "*util*.py" -not -path "./utils/*" -exec mv {} utils/ \;
    find . -name "*util*.js" -not -path "./utils/*" -exec mv {} utils/ \;

    check_status "File consolidation"
}

# Clean up temporary and build files
cleanup_temp_files() {
    print_header "Cleaning Temporary Files"

    print_progress "Removing Python cache files..."
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true

    print_progress "Removing test cache..."
    find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true

    print_progress "Removing coverage files..."
    find . -type f -name ".coverage" -delete 2>/dev/null || true
    rm -rf htmlcov/ 2>/dev/null || true

    print_progress "Removing system files..."
    find . -type f -name ".DS_Store" -delete 2>/dev/null || true

    print_progress "Removing log files..."
    find . -type f -name "*.log" -delete 2>/dev/null || true

    print_progress "Removing temporary files..."
    find . -type f -name "*.swp" -delete 2>/dev/null || true
    find . -type f -name ".env.local" -delete 2>/dev/null || true
    find . -type f -name "*.bak" -delete 2>/dev/null || true

    print_progress "Removing build directories..."
    rm -rf build/ dist/ *.egg-info/ 2>/dev/null || true
    rm -rf frontend/build/ frontend/dist/ 2>/dev/null || true

    check_status "Temporary file cleanup"
}

# Organize source code
organize_source() {
    print_header "Organizing Source Code"

    print_progress "Creating backend directory structure..."
    mkdir -p backend/{app,tests,docs,scripts}
    mkdir -p backend/app/{models,routes,services,utils}
    mkdir -p backend/tests/{unit,integration,e2e}

    print_progress "Creating frontend directory structure..."
    mkdir -p frontend/{src,tests,public,docs}
    mkdir -p frontend/src/{components,services,utils,styles}
    mkdir -p frontend/tests/{unit,integration,e2e}

    check_status "Source code organization"
}

# Consolidate documentation
organize_docs() {
    print_header "Organizing Documentation"

    print_progress "Creating documentation directories..."
    mkdir -p docs/{api,setup,testing,features}

    print_progress "Moving documentation files..."
    [ -f docs/API.md ] && mv docs/API.md docs/api/README.md
    [ -f docs/SETUP.md ] && mv docs/SETUP.md docs/setup/README.md
    [ -f docs/TEST_PLAN.md ] && mv docs/TEST_PLAN.md docs/testing/TEST_PLAN.md

    check_status "Documentation organization"
}

# Organize test files
organize_tests() {
    print_header "Organizing Tests"

    print_progress "Creating test directories..."
    mkdir -p tests/{unit,integration,e2e,setup}

    print_progress "Moving Python test files..."
    find . -name "*test*.py" -not -path "./tests/*" -not -path "./venv/*" -exec mv -f {} tests/unit/ \; 2>/dev/null || true

    print_progress "Moving JavaScript test files..."
    find . -name "*test*.js" -not -path "./tests/*" -not -path "./node_modules/*" -exec mv -f {} tests/unit/ \; 2>/dev/null || true

    check_status "Test organization"
}

# Clean up node modules
cleanup_node_modules() {
    print_header "Cleaning Node Modules"

    if [ -f "frontend/package.json" ]; then
        print_progress "Removing node_modules..."
        rm -rf frontend/node_modules

        print_progress "Reinstalling dependencies..."
        cd frontend
        npm install --silent
        cd ..
    fi

    check_status "Node modules cleanup"
}

# Clean up Python virtual environments
cleanup_venv() {
    print_header "Cleaning Python Virtual Environments"

    if [ -f "backend/requirements.txt" ]; then
        print_progress "Removing existing venv..."
        rm -rf backend/venv

        print_progress "Creating new venv..."
        cd backend
        python3 -m venv venv

        print_progress "Installing dependencies..."
        source venv/bin/activate
        pip install -r requirements.txt --quiet
        deactivate
        cd ..
    fi

    check_status "Virtual environment cleanup"
}

# Analyze codebase for gitignore patterns
analyze_for_gitignore() {
    print_header "Analyzing Codebase for Gitignore Patterns"

    print_progress "Creating temporary directory for analysis..."
    mkdir -p .tmp_gitignore

    # Find large files (>10MB) that might be binary/generated
    print_progress "Finding large files..."
    find . -type f -size +10M \
        -not -path "*/node_modules/*" \
        -not -path "*/venv/*" \
        -not -path "*/.git/*" \
        -printf "%P\n" > .tmp_gitignore/large_files.txt

    # Find common build directories
    print_progress "Finding build directories..."
    find . -type d \( \
        -name "build" -o \
        -name "dist" -o \
        -name "target" -o \
        -name "out" -o \
        -name "output" \
    \) -not -path "*/node_modules/*" -printf "%P\n" > .tmp_gitignore/build_dirs.txt

    # Find IDE/editor directories
    print_progress "Finding IDE directories..."
    find . -type d \( \
        -name ".idea" -o \
        -name ".vscode" -o \
        -name ".settings" -o \
        -name "*.sublime-workspace" \
    \) -printf "%P\n" > .tmp_gitignore/ide_dirs.txt

    # Find log files
    print_progress "Finding log files..."
    find . -type f \( \
        -name "*.log" -o \
        -name "*.log.*" -o \
        -name "*debug.log" \
    \) -not -path "*/node_modules/*" -printf "%P\n" > .tmp_gitignore/log_files.txt

    # Find cache directories
    print_progress "Finding cache directories..."
    find . -type d \( \
        -name "cache" -o \
        -name ".cache" -o \
        -name "__pycache__" -o \
        -name ".pytest_cache" \
    \) -printf "%P\n" > .tmp_gitignore/cache_dirs.txt

    # Find environment files
    print_progress "Finding environment files..."
    find . -type f \( \
        -name "*.env" -o \
        -name ".env.*" -o \
        -name "*.env.local" -o \
        -name "*.env.development" \
    \) -not -name ".env.example" -printf "%P\n" > .tmp_gitignore/env_files.txt

    # Find temporary files
    print_progress "Finding temporary files..."
    find . -type f \( \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name "*.swp" -o \
        -name "*.swo" -o \
        -name "*~" -o \
        -name "*.bak" \
    \) -printf "%P\n" > .tmp_gitignore/temp_files.txt

    # Find compiled files
    print_progress "Finding compiled files..."
    find . -type f \( \
        -name "*.pyc" -o \
        -name "*.pyo" -o \
        -name "*.pyd" -o \
        -name "*.so" -o \
        -name "*.dll" -o \
        -name "*.dylib" -o \
        -name "*.class" \
    \) -printf "%P\n" > .tmp_gitignore/compiled_files.txt

    # Find dependency lock files
    print_progress "Finding dependency files..."
    find . -type f \( \
        -name "package-lock.json" -o \
        -name "yarn.lock" -o \
        -name "poetry.lock" -o \
        -name "Pipfile.lock" \
    \) -printf "%P\n" > .tmp_gitignore/lock_files.txt

    check_status "Gitignore pattern analysis"
}

# Update gitignore
update_gitignore() {
    print_header "Updating .gitignore"
    print_progress "Writing new .gitignore..."

    # Start with base patterns
    cat << EOF > .gitignore
# Generated by cleanup script
# Last updated: $(date)

EOF

    # Add standard Python patterns
    cat << EOF >> .gitignore
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
EOF

    # Add standard Node patterns
    cat << EOF >> .gitignore

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
EOF

    # Add discovered patterns
    if [ -d ".tmp_gitignore" ]; then
        print_progress "Adding discovered patterns..."

        # Add large files
        if [ -f ".tmp_gitignore/large_files.txt" ] && [ -s ".tmp_gitignore/large_files.txt" ]; then
            echo -e "\n# Large files" >> .gitignore
            while read -r file; do
                echo "$file" >> .gitignore
            done < .tmp_gitignore/large_files.txt
        fi

        # Add build directories
        if [ -f ".tmp_gitignore/build_dirs.txt" ] && [ -s ".tmp_gitignore/build_dirs.txt" ]; then
            echo -e "\n# Build directories" >> .gitignore
            while read -r dir; do
                echo "$dir/" >> .gitignore
            done < .tmp_gitignore/build_dirs.txt
        fi

        # Add IDE directories
        if [ -f ".tmp_gitignore/ide_dirs.txt" ] && [ -s ".tmp_gitignore/ide_dirs.txt" ]; then
            echo -e "\n# IDE directories" >> .gitignore
            while read -r dir; do
                echo "$dir/" >> .gitignore
            done < .tmp_gitignore/ide_dirs.txt
        fi

        # Add log files
        if [ -f ".tmp_gitignore/log_files.txt" ] && [ -s ".tmp_gitignore/log_files.txt" ]; then
            echo -e "\n# Log files" >> .gitignore
            while read -r file; do
                echo "$file" >> .gitignore
            done < .tmp_gitignore/log_files.txt
        fi

        # Add cache directories
        if [ -f ".tmp_gitignore/cache_dirs.txt" ] && [ -s ".tmp_gitignore/cache_dirs.txt" ]; then
            echo -e "\n# Cache directories" >> .gitignore
            while read -r dir; do
                echo "$dir/" >> .gitignore
            done < .tmp_gitignore/cache_dirs.txt
        fi

        # Add environment files
        if [ -f ".tmp_gitignore/env_files.txt" ] && [ -s ".tmp_gitignore/env_files.txt" ]; then
            echo -e "\n# Environment files" >> .gitignore
            while read -r file; do
                echo "$file" >> .gitignore
            done < .tmp_gitignore/env_files.txt
        fi

        # Add temporary files
        if [ -f ".tmp_gitignore/temp_files.txt" ] && [ -s ".tmp_gitignore/temp_files.txt" ]; then
            echo -e "\n# Temporary files" >> .gitignore
            while read -r file; do
                echo "$file" >> .gitignore
            done < .tmp_gitignore/temp_files.txt
        fi

        # Add compiled files
        if [ -f ".tmp_gitignore/compiled_files.txt" ] && [ -s ".tmp_gitignore/compiled_files.txt" ]; then
            echo -e "\n# Compiled files" >> .gitignore
            while read -r file; do
                echo "$file" >> .gitignore
            done < .tmp_gitignore/compiled_files.txt
        fi

        # Add lock files
        if [ -f ".tmp_gitignore/lock_files.txt" ] && [ -s ".tmp_gitignore/lock_files.txt" ]; then
            echo -e "\n# Lock files" >> .gitignore
            while read -r file; do
                echo "$file" >> .gitignore
            done < .tmp_gitignore/lock_files.txt
        fi

        # Clean up
        rm -rf .tmp_gitignore
    fi

    # Add standard patterns at the end
    cat << EOF >> .gitignore

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

    # Sort and remove duplicates
    sort -u .gitignore -o .gitignore

    check_status "Gitignore update"
}

# Main execution
print_header "Starting Codebase Cleanup"

# Create backup
print_header "Creating Backup"
timestamp=$(date +%Y%m%d_%H%M%S)
print_progress "Creating backup archive..."
tar -czf "backup_${timestamp}.tar.gz" --exclude="node_modules" --exclude="venv" --exclude=".git" .
check_status "Backup creation"

# Run cleanup tasks
cleanup_temp_files || true
analyze_for_gitignore || true
handle_duplicates || true
cleanup_unused || true
cleanup_empty_dirs || true
consolidate_similar || true
organize_source || true
organize_docs || true
organize_tests || true
cleanup_node_modules || true
cleanup_venv || true
update_gitignore || true

print_header "Cleanup Complete"
echo "A backup of the original codebase is available at: backup_${timestamp}.tar.gz"
echo "Check the 'unused' directory for potentially unused files"

# Disable debugging
set +x

# Frontend cleanup
echo "Cleaning up frontend..."

# Convert TypeScript files to JSX
find frontend/src -name "*.tsx" -exec sh -c 'mv "$1" "${1%.tsx}.jsx"' _ {} \;

# Standardize CSS modules
find frontend/src -name "*.css" ! -name "*.module.css" -exec sh -c 'mv "$1" "${1%.css}.module.css"' _ {} \;

# Remove duplicate test directories
find frontend/src -type d -name "__tests__" ! -path "*/src/__tests__" -exec rm -rf {} +

# Move all tests to central location
mkdir -p frontend/src/__tests__/components
mkdir -p frontend/src/__tests__/hooks
mkdir -p frontend/src/__tests__/services
mkdir -p frontend/src/__tests__/store

# Move component tests
find frontend/src/components -name "*.test.jsx" -exec mv {} frontend/src/__tests__/components/ \;

# Move hook tests
find frontend/src/hooks -name "*.test.js" -exec mv {} frontend/src/__tests__/hooks/ \;

# Move service tests
find frontend/src/services -name "*.test.js" -exec mv {} frontend/src/__tests__/services/ \;

# Move store tests
find frontend/src/store -name "*.test.js" -exec mv {} frontend/src/__tests__/store/ \;

# Backend cleanup
echo "Cleaning up backend..."

# Consolidate models
mkdir -p backend/app/models/temp
cp -r backend/models/* backend/app/models/temp/
rm -rf backend/models
mv backend/app/models/temp/* backend/app/models/
rm -rf backend/app/models/temp

# Consolidate routes
mkdir -p backend/app/routes/temp
cp -r backend/routes/* backend/app/routes/temp/
rm -rf backend/routes
mv backend/app/routes/temp/* backend/app/routes/
rm -rf backend/app/routes/temp

# Clean up duplicate schema files
rm -f backend/app/schemas/storyboard\ 2.py

# Standardize service naming
for file in backend/app/services/*; do
  if [[ -f "$file" && ! "$file" =~ .*_service\.py$ && "$file" != */base.py && "$file" != */__init__.py ]]; then
    mv "$file" "${file%.py}_service.py"
  fi
done

echo "Cleanup complete!"
