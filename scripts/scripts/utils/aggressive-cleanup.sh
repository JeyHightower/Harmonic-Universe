#!/bin/bash

echo "Starting aggressive cleanup process..."

# Function to move to root directory and keep only the latest version of a file pattern
cd ../../
cleanup_pattern() {
    local pattern=$1
    local dir=$2
    echo "Cleaning pattern $pattern in $dir"

    # Find all matching files and sort by modification time
    files=$(find "$dir" -type f -name "$pattern" -exec ls -t {} + 2>/dev/null)
    if [ ! -z "$files" ]; then
        # Keep the first (latest) file
        latest=$(echo "$files" | head -n1)
        echo "Keeping latest version: $latest"
        # Remove all other versions
        echo "$files" | tail -n +2 | while read -r file; do
            echo "Removing duplicate: $file"
            rm -f "$file"
        done
    fi
}

# Function to aggressively clean frontend
clean_frontend() {
    local dir=$1
    echo "Aggressively cleaning frontend directory: $dir"

    # Remove development and build artifacts
    find "$dir" -type d -name "node_modules" -exec rm -rf {} +
    find "$dir" -type d -name ".cache" -exec rm -rf {} +
    find "$dir" -type d -name ".temp" -exec rm -rf {} +
    find "$dir" -type d -name "coverage" -exec rm -rf {} +
    find "$dir" -type d -name "__tests__" -exec rm -rf {} +
    find "$dir" -type d -name ".nyc_output" -exec rm -rf {} +

    # Clean up build directories
    rm -rf "$dir/dist" "$dir/build" "$dir/.next" "$dir/.nuxt"

    # Remove temporary and log files
    find "$dir" -type f \( \
        -name "*.log" -o \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name ".DS_Store" -o \
        -name "*.tsbuildinfo" -o \
        -name ".env.local" -o \
        -name ".env.development" -o \
        -name ".env.test" -o \
        -name "*.map" \
    \) -delete

    # Clean up specific frontend patterns
    cleanup_pattern "index-*.js" "$dir"
    cleanup_pattern "Layout-*.js" "$dir"
    cleanup_pattern "Dashboard-*.js" "$dir"
    cleanup_pattern "Home-*.js" "$dir"
    cleanup_pattern "vendor-*.js" "$dir"
    cleanup_pattern "react-*.js" "$dir"
    cleanup_pattern "hook-*.js" "$dir"
    cleanup_pattern "modal*.js" "$dir"
    cleanup_pattern "store-*.js" "$dir"
    cleanup_pattern "bundle*.js" "$dir"
    cleanup_pattern "vite.config.*" "$dir"
    cleanup_pattern "webpack.config.*" "$dir"
    cleanup_pattern "tsconfig.*" "$dir"
    cleanup_pattern ".babelrc*" "$dir"
    cleanup_pattern ".eslintrc*" "$dir"

    # Remove empty directories
    find "$dir" -type d -empty -delete
}

# Function to aggressively clean backend
clean_backend() {
    local dir=$1
    echo "Aggressively cleaning backend directory: $dir"

    # Remove Python cache files and directories
    find "$dir" -type d -name "__pycache__" -exec rm -rf {} +
    find "$dir" -type f -name "*.pyc" -delete
    find "$dir" -type f -name "*.pyo" -delete
    find "$dir" -type f -name "*.pyd" -delete
    find "$dir" -type d -name ".pytest_cache" -exec rm -rf {} +
    find "$dir" -type d -name ".coverage" -exec rm -rf {} +
    find "$dir" -type d -name "htmlcov" -exec rm -rf {} +

    # Remove logs and temporary files
    find "$dir" -type f \( \
        -name "*.log" -o \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name ".DS_Store" -o \
        -name "*.sqlite" -
