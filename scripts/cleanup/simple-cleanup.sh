#!/bin/bash

echo "Starting simple cleanup process..."

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

    # Remove specific file patterns keeping only the latest version
    echo "Cleaning up specific file patterns..."
    for pattern in "index-*.js" "Layout-*.js" "Dashboard-*.js" "Home-*.js" \
                  "vendor-react*.js" "react-*fix*.js" "hook-*.js" "modalTypes-*.js" \
                  "store-*.js" "bundle*.js" "build.sh*" "start.sh*" "render_build.sh*" \
                  "config.py*"; do
        # Find all files matching pattern
        files=$(ls -t $pattern 2>/dev/null)
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
    done

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

echo "Simple cleanup complete!"
