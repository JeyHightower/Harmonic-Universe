#!/bin/bash

# Function to clean TypeScript syntax from a file
clean_file() {
    local file=$1
    echo "Cleaning $file"

    # Create a temporary file
    local temp_file="${file}.tmp"

    # Remove TypeScript syntax
    cat "$file" | \
    # Remove type imports
    sed '/import.*type.*from/d' | \
    # Remove interface declarations
    sed '/^interface.*{/,/^}/d' | \
    # Remove type declarations
    sed '/^type.*=/,/;/d' | \
    # Remove type annotations
    sed 's/: [A-Za-z<>[\]|&{}]*//g' | \
    # Remove generic type parameters
    sed 's/<[A-Za-z,\s]*>//g' | \
    # Remove type assertions
    sed 's/as [A-Za-z<>[\]|&{}]*//g' | \
    # Remove export type statements
    sed '/export.*type/d' > "$temp_file"

    # Replace original file with cleaned version
    mv "$temp_file" "$file"
}

# Process all JavaScript and JSX files
find src -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    clean_file "$file"
done

echo "Cleanup complete!"
