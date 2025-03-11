#!/bin/bash

# Function to cleanup files matching a pattern
cleanup_pattern() {
    pattern=$1
    # Find the latest file matching the pattern
    latest=$(ls -t $pattern 2>/dev/null | head -n1)
    if [ ! -z "$latest" ]; then
        echo "Keeping latest version: $latest"
        # Remove all other files matching the pattern except the latest
        for f in $pattern; do
            if [ "$f" != "$latest" ]; then
                echo "Removing: $f"
                rm -f "$f"
            fi
        done
    fi
}

# Remove duplicate directories
rm -rf "assets 2" "static" "static 2"

# Cleanup numbered and backup files
find . -type f \( \
    -name "*[0-9].js" -o \
    -name "* [0-9].js" -o \
    -name "*[0-9].html" -o \
    -name "* [0-9].html" -o \
    -name "*.backup" -o \
    -name "*~" -o \
    -name "index*.html''" \
    \) -delete

# Cleanup specific patterns
cleanup_pattern "runtime-diagnostics*.js"
cleanup_pattern "index-*.js"
cleanup_pattern "Layout-*.js"
cleanup_pattern "Dashboard-*.js"
cleanup_pattern "Home-*.js"
cleanup_pattern "vendor-react*.js"
cleanup_pattern "react-*fix*.js"
cleanup_pattern "hook-*.js"
cleanup_pattern "index-*.css"

# Remove empty directories
find . -type d -empty -delete

echo "Cleanup complete!"
