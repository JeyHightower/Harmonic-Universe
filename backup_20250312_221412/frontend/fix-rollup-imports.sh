#!/bin/bash
set -e

echo "🔍 Finding and fixing problematic imports in rollup..."

# Find all files that import from native.js
find node_modules -type f -name "*.js" -exec grep -l "from '../../native.js'" {} \; 2>/dev/null | while read -r file; do
  echo "🔧 Fixing imports in $file..."

  # Create a backup of the original file
  cp "$file" "${file}.bak"

  # Replace the problematic import with the recommended pattern
  sed -i.tmp "s/import { \([^}]*\) } from '..\/..\/native.js';/import pkg from '..\/..\/native.js';\nconst { \1 } = pkg;/g" "$file"
  rm -f "${file}.tmp"

  echo "✅ Fixed $file"
done

# Specifically fix the xxhash imports
find node_modules -type f -name "*.js" -exec grep -l "xxhashBase16.*from '../../native.js'" {} \; 2>/dev/null | while read -r file; do
  echo "🔧 Fixing xxhash imports in $file..."

  # Create a backup of the original file
  cp "$file" "${file}.bak"

  # Replace the problematic import with the recommended pattern
  sed -i.tmp "s/import { \([^}]*xxhashBase[^}]*\) } from '..\/..\/native.js';/import pkg from '..\/..\/native.js';\nconst { \1 } = pkg;/g" "$file"
  rm -f "${file}.tmp"

  echo "✅ Fixed xxhash imports in $file"
done

echo "✅ All problematic imports fixed!"
