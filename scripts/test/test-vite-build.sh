#!/bin/bash
set -e

echo "🧪 Testing Vite build solution locally..."

# Check if we're in the project root
if [ ! -d "./frontend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

# Create a temporary directory for testing
echo "📁 Creating temporary test directory..."
mkdir -p .vite-test
cd .vite-test

# Create a minimal package.json
echo "📝 Creating test package.json..."
cat > package.json << EOF
{
  "name": "vite-test",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
EOF

# Create a minimal vite.config.js
echo "📝 Creating test vite.config.js..."
cat > vite.config.js << EOF
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
EOF

# Create a minimal index.html
echo "📝 Creating test index.html..."
cat > index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vite Test</title>
</head>
<body>
  <h1>Vite Test</h1>
  <script type="module" src="./main.js"></script>
</body>
</html>
EOF

# Create a minimal main.js
echo "📝 Creating test main.js..."
cat > main.js << EOF
console.log('Vite test loaded successfully!');
document.body.innerHTML += '<p>Vite test loaded successfully!</p>';
EOF

# Install Vite
echo "📦 Installing Vite..."
npm install --no-save vite@4.5.1

# Create a direct build script
echo "📝 Creating direct build script..."
cat > vite-build.js << EOF
// Direct Vite build script that doesn't rely on CLI
const path = require('path');
console.log('Starting programmatic Vite build...');
try {
  // Attempt to require Vite
  const vite = require('vite');
  console.log('Vite module loaded successfully');

  // Run the build
  vite.build({
    configFile: path.resolve(__dirname, 'vite.config.js'),
    mode: 'production',
    emptyOutDir: true
  }).catch(err => {
    console.error('Build error:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('Failed to load Vite module:', err);
  process.exit(1);
}
EOF

# Test Method 1: Use npx with fixed version
echo "🔨 Test Method 1: Using npx with fixed version..."
npx vite@4.5.1 build --mode production --emptyOutDir || echo "Method 1 failed, trying next method..."

# Test Method 2: Direct use of module if it exists
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "🔨 Test Method 2: Direct module use..."
    if [ -f "./node_modules/vite/bin/vite.js" ]; then
        echo "Running Vite directly from node_modules..."
        node ./node_modules/vite/bin/vite.js build --mode production --emptyOutDir || echo "Method 2 failed, trying next method..."
    else
        echo "⚠️ Vite.js not found in node_modules, skipping direct module method"
    fi
fi

# Test Method 3: Custom Node script approach
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "🔨 Test Method 3: Custom Node script approach..."
    node vite-build.js || echo "Method 3 failed, trying next method..."
fi

# Check if any method succeeded
if [ -d "dist" ] && [ -n "$(ls -A dist 2>/dev/null)" ]; then
    echo "✅ Test successful! At least one build method worked."
    echo "📋 Build output:"
    ls -la dist
else
    echo "❌ All build methods failed!"
fi

# Clean up
echo "🧹 Cleaning up..."
cd ..
rm -rf .vite-test

echo "�� Test completed!"
