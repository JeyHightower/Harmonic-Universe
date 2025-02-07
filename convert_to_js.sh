#!/bin/bash

# Function to convert a TypeScript file to JavaScript
convert_file() {
    local ts_file=$1
    local js_file=${ts_file%.*}.js

    # If it's a .tsx file, make it .jsx
    if [[ $ts_file == *.tsx ]]; then
        js_file=${ts_file%.tsx}.jsx
    fi

    # Create the JavaScript file if it doesn't exist
    if [ ! -f "$js_file" ]; then
        # Copy the TypeScript file to JavaScript
        cp "$ts_file" "$js_file"

        # Remove TypeScript-specific syntax
        sed -i '' 's/: [A-Za-z<>[\]|&{}]*//g' "$js_file"  # Remove type annotations
        sed -i '' 's/interface [^{]*{[^}]*}//g' "$js_file"  # Remove interfaces
        sed -i '' 's/type [^=]*= [^;]*;//g' "$js_file"  # Remove type definitions
        sed -i '' 's/import.*from.*types.*;//g' "$js_file"  # Remove type imports
        sed -i '' 's/export type.*;//g' "$js_file"  # Remove type exports

        echo "Converted $ts_file to $js_file"
    else
        echo "Skipping $ts_file, $js_file already exists"
    fi
}

# Find and convert all TypeScript files
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    convert_file "$file"
done

echo "Conversion complete!"
