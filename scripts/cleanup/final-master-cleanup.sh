#!/bin/bash

echo "🧹 Starting final master cleanup process..."
#move to root directory
cd ../../

# Function to keep only the latest version of a file pattern
cleanup_pattern() {
    local pattern=$1
    local dir=$2
    echo "  🔍 Cleaning pattern $pattern in $dir"

    # Find all matching files and sort by modification time
    latest=$(find "$dir" -type f -name "$pattern" -print0 | xargs -0 ls -t 2>/dev/null | head -n1)
    if [ ! -z "$latest" ]; then
        echo "    ✅ Keeping latest version: $latest"
        # Remove all other versions
        find "$dir" -type f -name "$pattern" ! -name "$(basename "$latest")" -delete
    fi
}

echo "
🔵 Phase 1: Backend Cleanup
------------------------"

# Clean backend directories
for dir in "backend" "app"; do
    if [ -d "$dir" ]; then
        echo "  🔹 Cleaning $dir..."

        # Remove Python cache files and directories
        find "$dir" -type d -name "__pycache__" -exec rm -rf {} +
        find "$dir" -type f \( \
            -name "*.pyc" -o \
            -name "*.pyo" -o \
            -name "*.pyd" -o \
            -name "*.log" -o \
            -name "*.tmp" -o \
            -name "*.temp" -o \
            -name ".DS_Store" -o \
            -name "*.sqlite" -o \
            -name "*.sqlite3" -o \
            -name "*.pid" -o \
            -name "*.bak" -o \
            -name "*~" -o \
            -name "*.swp" -o \
            -name "*.swo" -o \
            -name "test_*.py" -o \
            -name "*_test.py" \
        \) -delete

        # Remove test directories
        find "$dir" -type d \( \
            -name ".pytest_cache" -o \
            -name ".coverage" -o \
            -name "htmlcov" -o \
            -name ".tox" -o \
            -name "tests" -o \
            -name "test" -o \
            -name ".eggs" -o \
            -name "*.egg-info" \
        \) -exec rm -rf {} +

        # Clean up config files
        cleanup_pattern "config*.py" "$dir"
        cleanup_pattern "settings*.py" "$dir"
        cleanup_pattern "wsgi*.py" "$dir"
        cleanup_pattern "*.env*" "$dir"
    fi
done

echo "
🟢 Phase 2: Frontend Cleanup
-------------------------"

if [ -d "frontend" ]; then
    echo "  🔹 Cleaning frontend..."

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
        -name "*-[a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9].js" \
    \) -delete

    # Remove development directories
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
        -name "e2e" -o \
        -name "cypress" \
    \) -exec rm -rf {} +

    # Clean up build directories
    rm -rf frontend/dist frontend/build frontend/.next frontend/.nuxt

    # Clean up specific patterns
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

    # Remove backup directories
    rm -rf frontend/backups frontend/backup frontend/*_old frontend/*_bak
fi

echo "
🟣 Phase 3: Static Directory Cleanup
--------------------------------"

if [ -d "static" ]; then
    echo "  🔹 Cleaning static directory..."

    # Clean up React and vendor files
    cleanup_pattern "vendor-react*.js" "static"
    cleanup_pattern "react-*.js" "static"
    cleanup_pattern "hook-*.js" "static"
    cleanup_pattern "runtime-diagnostics*.js" "static"
    cleanup_pattern "*-fix*.js" "static"
    cleanup_pattern "*-patch*.js" "static"
    cleanup_pattern "*-suppressor*.js" "static"
    cleanup_pattern "*-patcher*.js" "static"
    cleanup_pattern "*-interceptor*.js" "static"
    cleanup_pattern "*-checker*.js" "static"
    cleanup_pattern "*-handler*.js" "static"
    cleanup_pattern "*-provider*.js" "static"
    cleanup_pattern "*-polyfill*.js" "static"
    cleanup_pattern "*-diagnostics*.js" "static"

    # Clean up component and bundle files
    cleanup_pattern "index-*.js" "static"
    cleanup_pattern "index-*.css" "static"
    cleanup_pattern "Layout-*.js" "static"
    cleanup_pattern "Dashboard-*.js" "static"
    cleanup_pattern "Home-*.js" "static"
    cleanup_pattern "store-*.js" "static"
    cleanup_pattern "bundle*.js" "static"
    cleanup_pattern "modalTypes-*.js" "static"

    # Remove old HTML files except index.html
    find static -maxdepth 1 -type f -name "*.html" ! -name "index.html" -delete

    # Remove cleanup scripts
    find static -maxdepth 1 -type f -name "*cleanup*.sh" -delete
fi

echo "
🔴 Phase 4: Final Cleanup
----------------------"

# Remove empty directories
find . -type d -empty -delete

# Remove all cleanup scripts except this one
find . -maxdepth 1 -type f -name "*cleanup*.sh" ! -name "$(basename $0)" -delete

echo "
✨ Master cleanup complete! ✨
"
