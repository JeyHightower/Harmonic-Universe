#!/bin/bash

echo "Starting thorough cleanup process v2..."

# Function to keep only the latest version of a file pattern
cleanup_pattern() {
    local pattern=$1
    local dir=$2
    echo "Cleaning pattern $pattern in $dir"

    # Find all matching files and sort by modification time
    latest=$(find "$dir" -type f -name "$pattern" -print0 | xargs -0 ls -t | head -n1)
    if [ ! -z "$latest" ]; then
        echo "Keeping latest version: $latest"
        # Remove all other versions
        find "$dir" -type f -name "$pattern" ! -name "$(basename "$latest")" -delete
    fi
}

# Thorough frontend cleanup
clean_frontend() {
    echo "Thoroughly cleaning frontend..."

    # Clean build artifacts and temporary files
    find frontend -type f \( \
        -name "*.log" -o \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name ".DS_Store" -o \
        -name "*.tsbuildinfo" -o \
        -name ".env.*" -o \
        -name "*.map" -o \
        -name "*[0-9].js" -o \
        -name "* [0-9].js" -o \
        -name "*.backup" -o \
        -name "*~" -o \
        -name "*.bak" -o \
        -name "*.old" -o \
        -name "*.test.js" -o \
        -name "*.spec.js" -o \
        -name "*.min.js" -o \
        -name "*-[a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9].js" \
    \) -delete

    # Remove development and test directories
    find frontend -type d \( \
        -name ".cache" -o \
        -name ".temp" -o \
        -name "coverage" -o \
        -name "__tests__" -o \
        -name "__mocks__" -o \
        -name ".nyc_output" -o \
        -name "test" -o \
        -name "tests" -o \
        -name ".storybook" -o \
        -name "storybook-static" -o \
        -name "e2e" -o \
        -name "cypress" -o \
        -name ".cypress" -o \
        -name "node_modules" \
    \) -exec rm -rf {} +

    # Clean up build directories
    rm -rf frontend/dist frontend/build frontend/.next frontend/.nuxt

    # Clean up specific frontend patterns
    cleanup_pattern "index-*.js" "frontend"
    cleanup_pattern "Layout-*.js" "frontend"
    cleanup_pattern "Dashboard-*.js" "frontend"
    cleanup_pattern "Home-*.js" "frontend"
    cleanup_pattern "vendor-*.js" "frontend"
    cleanup_pattern "react-*.js" "frontend"
    cleanup_pattern "hook-*.js" "frontend"
    cleanup_pattern "modal*.js" "frontend"
    cleanup_pattern "store-*.js" "frontend"
    cleanup_pattern "bundle*.js" "frontend"
    cleanup_pattern "vite.config.*" "frontend"
    cleanup_pattern "webpack.config.*" "frontend"
    cleanup_pattern "tsconfig.*" "frontend"
    cleanup_pattern ".babelrc*" "frontend"
    cleanup_pattern ".eslintrc*" "frontend"
    cleanup_pattern "jest.config.*" "frontend"
    cleanup_pattern "babel.config.*" "frontend"

    # Remove backup directories
    rm -rf frontend/backups frontend/backup frontend/*_old frontend/*_bak
}

# Thorough backend cleanup
clean_backend() {
    echo "Thoroughly cleaning backend..."

    # Remove Python cache files and directories recursively
    find . \( -name "__pycache__" -o -name "*.pyc" -o -name "*.pyo" -o -name "*.pyd" \) -delete

    # Remove development and test files
    find . -type f \( \
        -name "*.log" -o \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name ".DS_Store" -o \
        -name "*.sqlite" -o \
        -name "*.sqlite3" -o \
        -name "*.sqlite3-journal" -o \
        -name "*.pid" -o \
        -name "*.bak" -o \
        -name "*.swp" -o \
        -name "*.swo" -o \
        -name "test_*.py" -o \
        -name "*_test.py" -o \
        -name "*.pyc" -o \
        -name "*.pyo" -o \
        -name "*.pyd" -o \
        -name ".coverage" -o \
        -name ".pytest_cache" -o \
        -name "coverage.xml" -o \
        -name ".tox" \
    \) -delete

    # Remove test and cache directories
    find . -type d \( \
        -name "__pycache__" -o \
        -name ".pytest_cache" -o \
        -name ".coverage" -o \
        -name "htmlcov" -o \
        -name ".tox" -o \
        -name "tests" -o \
        -name "test" -o \
        -name ".eggs" -o \
        -name "*.egg-info" -o \
        -name "build" -o \
        -name "dist" \
    \) -exec rm -rf {} +

    # Clean up specific backend patterns
    cleanup_pattern "config*.py" "."
    cleanup_pattern "settings*.py" "."
    cleanup_pattern "wsgi*.py" "."
    cleanup_pattern "asgi*.py" "."
    cleanup_pattern "gunicorn*.py" "."
    cleanup_pattern "*.env*" "."
    cleanup_pattern "requirements*.txt" "."

    # Remove old migrations
    find . -path "*/migrations/*.py" ! -name "__init__.py" -delete
    find . -path "*/migrations/*.pyc" -delete

    # Remove development databases
    find . -name "db.sqlite3*" -delete
}

# Execute cleanup
if [ -d "frontend" ]; then
    clean_frontend
fi

if [ -d "backend" ]; then
    cd backend
    clean_backend
    cd ..
fi

if [ -d "app" ]; then
    cd app
    clean_backend
    cd ..
fi

# Remove empty directories
find . -type d -empty -delete

echo "Thorough cleanup v2 complete!"
