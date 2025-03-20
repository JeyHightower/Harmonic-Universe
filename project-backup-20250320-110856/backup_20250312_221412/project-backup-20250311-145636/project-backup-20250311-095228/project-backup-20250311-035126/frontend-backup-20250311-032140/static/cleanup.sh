#!/bin/bash

echo "Starting cleanup of duplicate files..."

# Function to keep only the latest version of numbered files
cleanup_numbered_files() {
    local base_name=$1
    # Find all files matching the pattern (with or without space before number)
    files=$(find . -maxdepth 1 -type f -name "${base_name}*[0-9].js" -o -name "${base_name} [0-9].js" -o -name "${base_name} [0-9][0-9].js")

    if [ ! -z "$files" ]; then
        # Keep the latest file, remove others
        latest=$(ls -t $files | head -n 1)
        for file in $files; do
            if [ "$file" != "$latest" ]; then
                echo "Removing duplicate: $file"
                rm "$file"
            fi
        done
    fi
}

# Remove backup files
echo "Removing backup files..."
find . -name "*.backup" -type f -delete
find . -name "*~" -type f -delete

# Remove old index files except the latest
echo "Cleaning up index files..."
cleanup_numbered_files "index-"

# Clean up runtime diagnostics duplicates
echo "Cleaning up runtime diagnostics..."
cleanup_numbered_files "runtime-diagnostics"

# Clean up react fix duplicates
echo "Cleaning up react fixes..."
cleanup_numbered_files "react-fix"
cleanup_numbered_files "react-hook-fix"
cleanup_numbered_files "react-error-handler"
cleanup_numbered_files "react-context-fix"
cleanup_numbered_files "react-force-expose"
cleanup_numbered_files "hook-js-patcher"
cleanup_numbered_files "direct-hook-patcher"
cleanup_numbered_files "final-hook-suppressor"
cleanup_numbered_files "early-warning-interceptor"
cleanup_numbered_files "redux-provider-fix"

# Remove any empty directories
echo "Removing empty directories..."
find . -type d -empty -delete

echo "Cleanup complete!"
