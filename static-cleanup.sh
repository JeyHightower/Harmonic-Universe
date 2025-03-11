#!/bin/bash

echo "Starting static directory cleanup..."

cd static || exit 1

# Function to keep only the latest version of a file pattern
cleanup_pattern() {
    local pattern=$1
    echo "Cleaning pattern $pattern"

    # Find all matching files and sort by modification time
    latest=$(find . -maxdepth 1 -type f -name "$pattern" -print0 | xargs -0 ls -t | head -n1)
    if [ ! -z "$latest" ]; then
        echo "Keeping latest version: $latest"
        # Remove all other versions
        find . -maxdepth 1 -type f -name "$pattern" ! -name "$(basename "$latest")" -delete
    fi
}

# Clean up vendor and React-related files
cleanup_pattern "vendor-react*.js"
cleanup_pattern "react-*.js"
cleanup_pattern "hook-*.js"
cleanup_pattern "runtime-diagnostics*.js"
cleanup_pattern "*-fix*.js"
cleanup_pattern "*-patch*.js"
cleanup_pattern "*-suppressor*.js"
cleanup_pattern "*-patcher*.js"
cleanup_pattern "*-interceptor*.js"
cleanup_pattern "*-checker*.js"
cleanup_pattern "*-handler*.js"
cleanup_pattern "*-provider*.js"
cleanup_pattern "*-polyfill*.js"
cleanup_pattern "*-diagnostics*.js"
cleanup_pattern "index-*.js"
cleanup_pattern "index-*.css"
cleanup_pattern "Layout-*.js"
cleanup_pattern "Dashboard-*.js"
cleanup_pattern "Home-*.js"
cleanup_pattern "store-*.js"
cleanup_pattern "bundle*.js"
cleanup_pattern "modalTypes-*.js"

# Remove old HTML files except index.html
find . -maxdepth 1 -type f -name "*.html" ! -name "index.html" -delete

# Remove cleanup scripts
find . -maxdepth 1 -type f -name "*cleanup*.sh" -delete

# Remove empty directories
find . -type d -empty -delete

echo "Static directory cleanup complete!"
