#!/bin/bash
set -e

echo "🔧 Fixing npm start script issue..."

# Check if we're in the frontend directory
if [ ! -f "./package.json" ]; then
  echo "📂 Changing to frontend directory..."
  cd frontend || { echo "❌ Frontend directory not found!"; exit 1; }
fi

# Check if package.json exists
if [ ! -f "./package.json" ]; then
  echo "❌ package.json not found in frontend directory!"
  exit 1
fi

# Backup the original package.json
cp package.json package.json.bak

# Check if start script already exists
if grep -q '"start":' package.json; then
  echo "✅ Start script already exists in package.json"
else
  echo "📝 Adding start script to package.json..."
  # Use sed to add the start script after the dev script
  sed -i.tmp '/"dev": "vite",/a\
    "start": "vite",
  ' package.json
  rm -f package.json.tmp
fi

echo "✅ npm start script fixed! You can now run 'npm start' in the frontend directory."
echo "🚀 To start the development server, run: cd frontend && npm start"
