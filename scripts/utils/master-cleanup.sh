#!/bin/bash

echo "Starting master cleanup process..."

# Function to keep only the latest version of a file pattern
cleanup_pattern() {
    local pattern=$1
    local latest

    # Find all matching files and sort by modification time
    readarray -t files < <(find . -maxdepth 1 -type f -name "$pattern" -printf "%T@ %p\n" | sort -nr | cut -d' ' -f2-)

    if [ ${#files[@]} -gt 1 ]; then
        # Keep the first (latest) file
        latest="${files[0]}"
        echo "Keeping latest version: $latest"

        # Remove all other versions
        for file in "${files[@]:1}"; do
            echo "Removing duplicate: $file"
            rm "$file"
        done
    fi
}

# Function to clean a directory
clean_directory() {
    local dir=$1
    echo "Cleaning directory: $dir"
    cd "$dir" || return

    # Remove duplicate directories
    echo "Removing duplicate directories..."
    rm -rf "assets 2" "static 2" "build 2" "dist 2"

    # Clean up numbered and backup files
    echo "Cleaning up numbered and backup files..."
    find . -type f \( \
        -name "* [0-9].*" -o \
        -name "*[0-9].*" -o \
        -name "*.backup" -o \
        -name "*~" -o \
        -name "*.bak" -o \
        -name "*.original" -o \
        -name "*.old" -o \
        -name "*''*" -o \
        -name "*.new" \
    \) -delete

    # Clean up specific patterns
    echo "Cleaning up specific file patterns..."
    cleanup_pattern "index-*.js"
    cleanup_pattern "Layout-*.js"
    cleanup_pattern "Dashboard-*.js"
    cleanup_pattern "Home-*.js"
    cleanup_pattern "vendor-react*.js"
    cleanup_pattern "react-*fix*.js"
    cleanup_pattern "hook-*.js"
    cleanup_pattern "modalTypes-*.js"
    cleanup_pattern "store-*.js"
    cleanup_pattern "bundle*.js"
    cleanup_pattern "build.sh*"
    cleanup_pattern "start.sh*"
    cleanup_pattern "render_build.sh*"
    cleanup_pattern "config.py*"

    # Remove empty directories
    echo "Removing empty directories..."
    find . -type d -empty -delete

    cd - > /dev/null || return
}

# Clean main directories
echo "Cleaning root directory..."
clean_directory "."

# Clean other directories if they exist
for dir in frontend dist build static backups conflict_reports; do
    if [ -d "$dir" ]; then
        echo "Cleaning $dir directory..."
        clean_directory "$dir"
    fi
done

echo "Master cleanup complete!"
