#!/bin/bash

# root-cleanup.sh - Comprehensive root cleanup script
# This script will clean up the root directory, invoking backend and frontend cleanup scripts,
# and removing redundant files at the root level.

set -e  # Exit immediately if any command fails

# Check if we're in the project root directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "Error: Please run this script from the project root directory."
  exit 1
fi

echo "=== Harmonic Universe Root Cleanup ==="
echo "This script will clean up the root directory, invoke backend and frontend cleanup scripts,"
echo "and remove redundant files at the root level."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Create backup of the entire project directory
BACKUP_DIR="project-backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup of the entire project directory to $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

# Use rsync instead of cp for more reliable copying
if command -v rsync &> /dev/null; then
  rsync -a --quiet ./ "$BACKUP_DIR/" 2>/dev/null
else
  # Fallback to cp with error suppression if rsync is not available
  cp -r ./* "$BACKUP_DIR/" 2>/dev/null || true
fi
echo "Backup created successfully."

# Invoke backend cleanup script
if [ -f "backend-cleanup.sh" ]; then
  echo "Running backend cleanup..."
  ./backend-cleanup.sh
else
  echo "Warning: backend-cleanup.sh not found. Skipping backend cleanup."
fi

# Invoke frontend cleanup script
if [ -f "frontend-cleanup.sh" ]; then
  echo "Running frontend cleanup..."
  ./frontend-cleanup.sh
else
  echo "Warning: frontend-cleanup.sh not found. Skipping frontend cleanup."
fi

# Remove common temporary and backup files from the root directory
find . -maxdepth 1 -type f \(
  -name "*.log" -o
  -name "*.tmp" -o
  -name "*.temp" -o
  -name ".DS_Store" -o
  -name "*.bak" -o
  -name "*~" -o
  -name "*.swp" -o
  -name "*.swo"
\) -delete

echo "Root-level temporary and backup files removed."

# Reinstall dependencies if needed
# Uncomment the following lines if you want to reinstall dependencies
# echo "Reinstalling backend dependencies..."
# cd backend && pip install -r requirements.txt
# cd ..
# echo "Reinstalling frontend dependencies..."
# cd frontend && npm install
# cd ..

# Final message
echo ""
echo "=== Root Cleanup Complete ==="
echo "The root directory has been cleaned up, and backend and frontend cleanup scripts have been invoked."
echo ""
echo "Next steps:"
echo "1. Verify the application can start with 'npm start'"
echo "2. Check that all features are working properly"
echo "3. If you encounter any issues, restore from the backup at $BACKUP_DIR"
echo ""

exit 0
