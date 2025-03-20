#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║             NPM START SCRIPT FIX                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the project root
if [ ! -d "./frontend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ package.json not found in frontend directory!"
  exit 1
fi

echo "📝 Updating package.json with proper start script..."

# Create a temporary file
TMP_FILE=$(mktemp)

# Read the package.json file
PACKAGE_JSON=$(cat package.json)

# Check if the start script already exists
if grep -q '"start":' package.json; then
  # Update the existing start script
  sed 's/"start": ".*"/"start": "vite"/g' package.json > "$TMP_FILE"
else
  # Add the start script if it doesn't exist
  sed 's/"scripts": {/"scripts": {\n    "start": "vite",/g' package.json > "$TMP_FILE"
fi

# Replace the package.json with the updated version
mv "$TMP_FILE" package.json

echo "✅ Start script fixed! You can now run 'npm start' in the frontend directory."
echo ""
echo "🚀 To test:"
echo "  cd frontend && npm start"
