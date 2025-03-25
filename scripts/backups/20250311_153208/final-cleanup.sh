#!/bin/bash

echo "Starting final cleanup process..."

# Clean frontend
if [ -d "frontend" ]; then
    echo "Cleaning frontend..."

    # Remove build artifacts and temp files
    find frontend -type f \( \
        -name "*.log" -o \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name ".DS_Store" -o \
        -name "*.tsbuildinfo" -o \
        -name ".env.local" -o \
        -name ".env.development" -o \
        -name ".env.test" -o \
        -name "*.map" -o \
        -name "*[0-9].js" -o \
        -name "* [0-9].js" -o \
        -name "*.backup" -o \
        -name "*~" -o \
        -name "*.bak" -o \
        -name "*.original" -o \
        -name "*.old" \
    \) -delete

    # Remove cache and test directories
    find frontend -type d \( \
        -name ".cache" -o \
        -name ".temp" -o \
        -name "coverage" -o \
        -name "__tests__" -o \
        -name ".nyc_output" \
    \) -exec rm -rf {} +

    # Clean up build directories
    rm -rf frontend/dist frontend/build frontend/.next frontend/.nuxt
fi

# Clean backend and app
for dir in "backend" "app"; do
    if [ -d "$dir" ]; then
        echo "Cleaning $dir..."

        # Remove Python cache files
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
            -name "*.sqlite3-journal" -o \
            -name "*.pid" -o \
            -name "*.bak" -o \
            -name "*~" -o \
            -name "*.swp" -o \
            -name "*.swo" \
        \) -delete

        # Remove test cache and coverage
        find "$dir" -type d \( \
            -name ".pytest_cache" -o \
            -name ".coverage" -o \
            -name "htmlcov" \
        \) -exec rm -rf {} +
    fi
done

# Clean root directory
echo "Cleaning root directory..."
find . -maxdepth 1 -type f \( \
    -name "*.log" -o \
    -name "*.tmp" -o \
    -name "*.temp" -o \
    -name ".DS_Store" -o \
    -name "*.bak" -o \
    -name "*~" -o \
    -name "*.swp" -o \
    -name "*.swo" \
) -delete

# Remove empty directories
find . -type d -empty -delete

echo "Final cleanup complete!"
