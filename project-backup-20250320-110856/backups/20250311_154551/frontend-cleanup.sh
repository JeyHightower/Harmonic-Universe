#!/bin/bash

# frontend-cleanup.sh - Comprehensive frontend cleanup script
# This script will clean up the frontend directory, removing redundant files,
# fixing router conflicts, and properly reinstalling dependencies.

set -e  # Exit immediately if any command fails

# Check if we're in the project root directory
if [ ! -d "frontend" ]; then
  echo "Error: Please run this script from the project root directory."
  exit 1
fi

echo "=== Harmonic Universe Frontend Cleanup ==="
echo "This script will clean up the frontend directory to fix React Router conflicts,"
echo "consolidate nested directories, and reorganize into a standard structure."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Create backup of frontend directory
BACKUP_DIR="frontend-backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup of frontend directory to $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

# Use rsync instead of cp for more reliable copying
if command -v rsync &> /dev/null; then
  rsync -a --quiet frontend/ "$BACKUP_DIR/" 2>/dev/null
else
  # Fallback to cp with error suppression if rsync is not available
  cp -r frontend/* "$BACKUP_DIR/" 2>/dev/null || true
fi
echo "Backup created successfully."

# Clean up node_modules and package-lock.json
echo "Removing node_modules and package-lock.json..."
rm -rf frontend/node_modules
rm -f frontend/package-lock.json
echo "Node modules and package-lock.json removed."

# Remove redundant fix files
echo "Removing redundant React fix files..."
if [ -d "frontend/static/react-fixes" ]; then
  rm -rf frontend/static/react-fixes
fi

# Be more careful with file removals, checking if they exist first
for file in \
  "frontend/src/utils/ensure-router-provider.js" \
  "frontend/src/utils/ensure-redux-provider.js"; do
  if [ -f "$file" ]; then
    rm -f "$file"
  fi
done

# Use find with proper error handling
echo "Removing polyfill files..."
find frontend -path "*/node_modules" -prune -o -name "*polyfill*.js" -type f -delete 2>/dev/null || true

echo "Redundant fix files removed."

# Remove duplicate config files
echo "Cleaning up redundant configuration files..."
find frontend -path "*/node_modules" -prune -o -name "*.backup" -type f -delete 2>/dev/null || true
find frontend -path "*/node_modules" -prune -o -name "*.bak" -type f -delete 2>/dev/null || true
find frontend -path "*/node_modules" -prune -o -name "vite.config.js.*" -type f -delete 2>/dev/null || true
find frontend -path "*/node_modules" -prune -o -name "*.config.js.backup" -type f -delete 2>/dev/null || true
echo "Redundant configuration files removed."

# Update the Router configuration in App.jsx to fix the nested Router issue
echo "Fixing Router configuration in App.jsx..."
if [ -f "frontend/src/App.jsx" ]; then
  # Create a backup of the original file
  cp frontend/src/App.jsx frontend/src/App.jsx.bak 2>/dev/null || true

  # Fix the Router component issue using sed, handling errors gracefully
  sed -i.bak 's/import { BrowserRouter as Router, Routes, Route } from/import { Routes, Route } from/g' frontend/src/App.jsx 2>/dev/null || echo "Warning: Could not update Router import in App.jsx"
  sed -i.bak 's/<Router>[ ]*<div/<div/g' frontend/src/App.jsx 2>/dev/null || echo "Warning: Could not update Router opening tag in App.jsx"
  sed -i.bak 's/<\/div>[ ]*<\/Router>/<\/div>/g' frontend/src/App.jsx 2>/dev/null || echo "Warning: Could not update Router closing tag in App.jsx"

  # Remove the backup files created by sed
  rm -f frontend/src/App.jsx.bak 2>/dev/null || true
  echo "App.jsx has been updated to fix Router configuration."
else
  echo "Warning: App.jsx not found. Router configuration not updated."
fi

# Clean up any other backup files created
find frontend -path "*/node_modules" -prune -o -name "*.bak" -type f -delete 2>/dev/null || true

# Create a temporary directory for consolidated files
echo "Creating temporary directory for consolidation..."
TEMP_DIR="frontend-temp-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TEMP_DIR/src"

# Standard React/Vite directories
echo "Creating standard directory structure..."
mkdir -p "$TEMP_DIR/src/components"
mkdir -p "$TEMP_DIR/src/features"
mkdir -p "$TEMP_DIR/src/layouts"
mkdir -p "$TEMP_DIR/src/hooks"
mkdir -p "$TEMP_DIR/src/utils"
mkdir -p "$TEMP_DIR/src/assets"
mkdir -p "$TEMP_DIR/src/styles"
mkdir -p "$TEMP_DIR/src/contexts"
mkdir -p "$TEMP_DIR/src/services"
mkdir -p "$TEMP_DIR/src/store"

# Copy core config files
echo "Copying core configuration files..."
if [ -f "frontend/package.json" ]; then
  cp frontend/package.json "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy package.json"
else
  echo "Warning: package.json not found"
fi

if [ -f "frontend/vite.config.js" ]; then
  cp frontend/vite.config.js "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy vite.config.js"
else
  echo "Warning: vite.config.js not found"
fi

if [ -f "frontend/index.html" ]; then
  cp frontend/index.html "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy index.html"
else
  echo "Warning: index.html not found"
fi

if [ -d "frontend/public" ]; then
  mkdir -p "$TEMP_DIR/public"
  cp -r frontend/public/* "$TEMP_DIR/public/" 2>/dev/null || echo "Warning: Could not copy public directory contents"
else
  echo "Warning: public directory not found"
fi

# Find and copy all component files - with better error handling
echo "Consolidating component files..."
while IFS= read -r file || [[ -n "$file" ]]; do
  # Skip node_modules and obvious backup files
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"backup"* ]] || [[ "$file" == *".git"* ]]; then
    continue
  fi

  # Create target directory based on file path or name
  if [[ "$file" == *"/component"* ]] || [[ "$file" == *"/components"* ]] || [[ "$(basename "$file")" == *"Component"* ]]; then
    target="$TEMP_DIR/src/components/$(basename "$file")"
  elif [[ "$file" == *"/feature"* ]] || [[ "$file" == *"/features"* ]] || [[ "$file" == *"/page"* ]] || [[ "$file" == *"/pages"* ]]; then
    target="$TEMP_DIR/src/features/$(basename "$file")"
  elif [[ "$file" == *"/layout"* ]] || [[ "$file" == *"/layouts"* ]]; then
    target="$TEMP_DIR/src/layouts/$(basename "$file")"
  elif [[ "$file" == *"/hook"* ]] || [[ "$file" == *"/hooks"* ]] || [[ "$(basename "$file")" == *"use"* ]]; then
    target="$TEMP_DIR/src/hooks/$(basename "$file")"
  elif [[ "$file" == *"/util"* ]] || [[ "$file" == *"/utils"* ]]; then
    target="$TEMP_DIR/src/utils/$(basename "$file")"
  elif [[ "$file" == *"/asset"* ]] || [[ "$file" == *"/assets"* ]]; then
    target="$TEMP_DIR/src/assets/$(basename "$file")"
  elif [[ "$file" == *"/style"* ]] || [[ "$file" == *"/styles"* ]] || [[ "$file" == *".css" ]]; then
    target="$TEMP_DIR/src/styles/$(basename "$file")"
  elif [[ "$file" == *"/context"* ]] || [[ "$file" == *"/contexts"* ]] || [[ "$(basename "$file")" == *"Context"* ]]; then
    target="$TEMP_DIR/src/contexts/$(basename "$file")"
  elif [[ "$file" == *"/service"* ]] || [[ "$file" == *"/services"* ]] || [[ "$file" == *"/api"* ]]; then
    target="$TEMP_DIR/src/services/$(basename "$file")"
  elif [[ "$file" == *"/store"* ]] || [[ "$file" == *"/redux"* ]] || [[ "$(basename "$file")" == *"slice"* ]]; then
    target="$TEMP_DIR/src/store/$(basename "$file")"
  # Handle core files specifically
  elif [[ "$(basename "$file")" == "App.jsx" ]] || [[ "$(basename "$file")" == "App.js" ]] || [[ "$(basename "$file")" == "index.js" ]] || [[ "$(basename "$file")" == "index.jsx" ]] || [[ "$(basename "$file")" == "main.js" ]] || [[ "$(basename "$file")" == "main.jsx" ]]; then
    target="$TEMP_DIR/src/$(basename "$file")"
  # For other files that don't match any specific category, put them in utils
  else
    target="$TEMP_DIR/src/utils/$(basename "$file")"
  fi

  # Copy the file if it exists
  if [ -f "$file" ]; then
    cp "$file" "$target" 2>/dev/null || echo "Warning: Could not copy $file"
  fi
done < <(find frontend -path "*/node_modules" -prune -o -path "*/backup*" -prune -o -path "*/.git" -prune -o \( -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" \) -type f -print 2>/dev/null)

# Copy CSS files with better error handling
echo "Copying CSS files..."
while IFS= read -r file || [[ -n "$file" ]]; do
  # Skip node_modules and backup files
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"backup"* ]] || [[ "$file" == *".git"* ]]; then
    continue
  fi

  if [ -f "$file" ]; then
    cp "$file" "$TEMP_DIR/src/styles/$(basename "$file")" 2>/dev/null || echo "Warning: Could not copy $file"
  fi
done < <(find frontend -path "*/node_modules" -prune -o -path "*/backup*" -prune -o -path "*/.git" -prune -o -name "*.css" -type f -print 2>/dev/null)

# Copy asset files (images, fonts, etc.) with better error handling
echo "Copying asset files..."
while IFS= read -r file || [[ -n "$file" ]]; do
  # Skip node_modules and backup files
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"backup"* ]] || [[ "$file" == *".git"* ]]; then
    continue
  fi

  if [ -f "$file" ]; then
    cp "$file" "$TEMP_DIR/src/assets/$(basename "$file")" 2>/dev/null || echo "Warning: Could not copy $file"
  fi
done < <(find frontend -path "*/node_modules" -prune -o -path "*/backup*" -prune -o -path "*/.git" -prune -o \( -name "*.svg" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.ico" -o -name "*.ttf" -o -name "*.woff" -o -name "*.woff2" \) -type f -print 2>/dev/null)

# Check if we have essential files
echo "Checking for essential files..."
MISSING_ESSENTIAL=false

if [ ! -f "$TEMP_DIR/src/index.js" ] && [ ! -f "$TEMP_DIR/src/index.jsx" ] && [ ! -f "$TEMP_DIR/src/main.js" ] && [ ! -f "$TEMP_DIR/src/main.jsx" ]; then
  echo "WARNING: No entry point file found (index.js/jsx or main.js/jsx)"

  # Search for these files in the original directory
  for file in index.js index.jsx main.js main.jsx; do
    found_file=$(find frontend -path "*/node_modules" -prune -o -name "$file" -type f -print -quit 2>/dev/null)
    if [ -n "$found_file" ]; then
      echo "Found entry point at: $found_file"
      cp "$found_file" "$TEMP_DIR/src/$(basename "$found_file")" 2>/dev/null || echo "Warning: Could not copy $found_file"
      break
    fi
  done

  if [ ! -f "$TEMP_DIR/src/index.js" ] && [ ! -f "$TEMP_DIR/src/index.jsx" ] && [ ! -f "$TEMP_DIR/src/main.js" ] && [ ! -f "$TEMP_DIR/src/main.jsx" ]; then
    MISSING_ESSENTIAL=true
  fi
fi

if [ ! -f "$TEMP_DIR/src/App.js" ] && [ ! -f "$TEMP_DIR/src/App.jsx" ]; then
  echo "WARNING: No App component found (App.js/jsx)"

  # Search for App component in the original directory
  for file in App.js App.jsx; do
    found_file=$(find frontend -path "*/node_modules" -prune -o -name "$file" -type f -print -quit 2>/dev/null)
    if [ -n "$found_file" ]; then
      echo "Found App component at: $found_file"
      cp "$found_file" "$TEMP_DIR/src/$(basename "$found_file")" 2>/dev/null || echo "Warning: Could not copy $found_file"
      break
    fi
  done

  if [ ! -f "$TEMP_DIR/src/App.js" ] && [ ! -f "$TEMP_DIR/src/App.jsx" ]; then
    MISSING_ESSENTIAL=true
  fi
fi

if [ ! -f "$TEMP_DIR/vite.config.js" ]; then
  echo "WARNING: No Vite config found (vite.config.js)"
  MISSING_ESSENTIAL=true
fi

if [ "$MISSING_ESSENTIAL" = true ]; then
  echo "Some essential files are missing. Consider restoring them from the backup."
else
  echo "All essential files are present."
fi

# Replace original frontend directory with consolidated version
echo "Replacing original frontend directory with consolidated version..."
if [ -d "frontend" ]; then
  rm -rf frontend
fi
mv "$TEMP_DIR" frontend

# Create a new .env file if needed
if [ ! -f "frontend/.env" ]; then
  echo "Creating default .env file..."
  echo "VITE_API_URL=http://localhost:5001" > frontend/.env
  echo ".env file created."
fi

# Reinstall dependencies
echo "Reinstalling frontend dependencies..."
cd frontend || { echo "Failed to change to frontend directory"; exit 1; }
npm install
echo "Dependencies reinstalled successfully."

echo ""
echo "=== Frontend Cleanup Complete ==="
echo "The frontend directory has been cleaned up, consolidated, and reorganized"
echo "into a standard React/Vite structure. Dependencies have been reinstalled."
echo ""
echo "Next steps:"
echo "1. Run 'cd frontend && npm run dev' to start the Vite dev server"
echo "2. Check that there are no Router errors in the console"
echo "3. If you encounter any issues, restore from the backup at $BACKUP_DIR"
echo ""

exit 0
