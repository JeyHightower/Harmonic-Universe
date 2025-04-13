#!/bin/bash

# Script to convert JavaScript files with ES Module syntax to .mjs files
# This script renames the files and updates import statements to reference the new .mjs files

set -e

# Special handling for certain files that shouldn't be converted
SKIP_PATTERNS=(
  "frontend/babel.config.js"   # This is a configuration file
  "frontend/vite.config.js"    # This is a configuration file that Vite expects to be .js
  "frontend/eslint.config.js"  # ESLint configuration
  "frontend/src/__tests__"     # Test files
  "frontend/src/assets"        # Build assets
)

# Function to check if a file should be skipped
should_skip() {
  local file="$1"
  for skip in "${SKIP_PATTERNS[@]}"; do
    if [[ "$file" == "$skip" || "$file" == "$skip"* ]]; then
      return 0
    fi
  done
  return 1
}

# Create arrays to store files
FILES=()
CONVERTED_FILES=()

# Find files with ES Module syntax
while IFS= read -r file; do
  FILES+=("$file")
done < <(find frontend -name "*.js" -type f -exec grep -l "import\|export" {} \; | grep -v "node_modules")

# Print the list of files that will be converted
echo "Files to be converted:"
for file in "${FILES[@]}"; do
  if ! should_skip "$file"; then
    echo "  $file"
    CONVERTED_FILES+=("$file")
  fi
done

# Confirm before proceeding
read -p "Convert these files? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 1
fi

# Convert the files
for file in "${FILES[@]}"; do
  if should_skip "$file"; then
    echo "Skipping $file"
    continue
  fi

  # Create the new filename
  new_file="${file%.js}.mjs"
  echo "Converting $file to $new_file"
  
  # Rename the file
  mv "$file" "$new_file"
done

# Update import statements in all files
echo "Updating import statements in all files..."

# Create a function to extract the base name of a file path
get_basename() {
  basename "$1"
}

# Find all files that might contain import statements
ALL_FILES=()
while IFS= read -r file; do
  ALL_FILES+=("$file")
done < <(find frontend -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | grep -v "node_modules")

# For each file that we converted, update references to it in other files
for original_file in "${CONVERTED_FILES[@]}"; do
  base_filename=$(get_basename "$original_file")
  base_name="${base_filename%.js}"
  
  echo "Updating references to $base_name.js..."
  
  for target_file in "${ALL_FILES[@]}"; do
    # Skip if the file doesn't exist (might have been renamed)
    if [ ! -f "$target_file" ]; then
      continue
    fi
    
    # Update explicit extensions in import statements
    # For example: import X from './path/file.js' -> import X from './path/file.mjs'
    if grep -q "import.*from.*/$base_name\.js[\"']" "$target_file"; then
      echo "  Updating import in $target_file"
      sed -i.bak "s|import\(.*\)from\(.*\)/$base_name\.js[\"']|import\1from\2/$base_name.mjs\"|g" "$target_file"
    fi
    
    # For direct imports of files
    if grep -q "import.*from.*/$base_name[\"']" "$target_file"; then
      echo "  Updating direct import in $target_file"
      # This is a more complex case and might need manual inspection
      echo "    Note: You may need to manually check imports with no extension in $target_file"
    fi
  done
done

# Clean up backup files
find frontend -name "*.bak" -delete

echo "Conversion complete!"
echo "Note: Some imports without explicit file extensions might need manual updates." 