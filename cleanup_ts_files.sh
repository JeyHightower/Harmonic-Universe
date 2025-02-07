#!/bin/bash

# Remove TypeScript files that have been converted
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    js_file=${file%.*}.js
    jsx_file=${file%.tsx}.jsx

    if [[ -f "$js_file" ]] || [[ -f "$jsx_file" ]]; then
        echo "Removing $file"
        rm "$file"
    fi
done

echo "Cleanup complete!"
