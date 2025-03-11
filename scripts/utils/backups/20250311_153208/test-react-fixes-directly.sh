#!/bin/bash
# test-react-fixes-directly.sh - Test React error fixes by directly opening index.html
set -e  # Exit on error

echo "===== TESTING REACT ERROR FIXES DIRECTLY ====="
echo "Date: $(date)"

# Check if files exist
echo "Verifying fix files..."
files=(
  "static/react-error-handler.js"
  "static/react-polyfill.js"
  "static/react-context-provider.js"
  "static/hook-fix.js"
  "static/react-version-checker.js"
  "static/react-diagnostics.js"
  "static/index.html"
  "static/manifest.json"
  "static/favicon.ico"
)

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️ Warning: $file not found. This may cause issues."

    # Create placeholders for missing essential files
    if [[ "$file" == "static/manifest.json" && ! -f "static/manifest.json" ]]; then
      echo "Creating placeholder manifest.json..."
      echo '{
  "short_name": "Harmonic Universe",
  "name": "Harmonic Universe",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}' > static/manifest.json
      echo "✅ Created placeholder manifest.json"
    fi

    if [[ "$file" == "static/favicon.ico" && ! -f "static/favicon.ico" ]]; then
      echo "Creating placeholder favicon.ico..."
      touch static/favicon.ico
      echo "✅ Created placeholder favicon.ico"
    fi
  else
    echo "✅ $file found"
  fi
done

# Get the full path to index.html
HTML_PATH="$(pwd)/static/index.html"
if [ ! -f "$HTML_PATH" ]; then
  echo "ERROR: $HTML_PATH not found!"
  exit 1
fi

echo "===== OPENING INDEX.HTML DIRECTLY ====="
echo "Note: Some features may not work properly without a web server"
echo "Use test-react-fixes.sh for full testing with a web server"

# Open the HTML file directly in the default browser
if command -v open &>/dev/null; then
  echo "Opening browser..."
  open "$HTML_PATH"
elif command -v xdg-open &>/dev/null; then
  echo "Opening browser..."
  xdg-open "$HTML_PATH"
elif command -v start &>/dev/null; then
  echo "Opening browser..."
  start "$HTML_PATH"
else
  echo "Unable to automatically open browser."
  echo "Please open this file manually: $HTML_PATH"
fi

echo ""
echo "===== DIRECT TESTING NOTES ====="
echo "1. When opening HTML files directly (using file://), some features may not work:"
echo "   - AJAX requests will fail due to CORS restrictions"
echo "   - Some JavaScript APIs may be restricted"
echo "   - Relative paths may not work properly"
echo ""
echo "2. Click the 'Show Diagnostics' button in the top-right corner to see detailed React status"
echo "3. Check the browser console (F12) for any JavaScript errors"
echo "4. Use test-react-fixes.sh with a web server for complete testing"
echo ""
echo "Test initiated at $(date)"
exit 0
