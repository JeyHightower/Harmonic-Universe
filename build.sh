#!/usr/bin/env bash
# exit on error
set -o errexit

# Install backend dependencies
pip install -r requirements.txt

# Navigate to frontend directory
cd frontend

# Create crypto polyfill file
cat > crypto-polyfill.cjs << 'EOL'
const crypto = require('crypto');

// Add missing getRandomValues function to crypto
if (!crypto.getRandomValues) {
  crypto.getRandomValues = function getRandomValues(array) {
    const bytes = crypto.randomBytes(array.length);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes[i];
    }
    return array;
  };
}

// Monkey patch the global crypto object
global.crypto = crypto;
EOL

# Install frontend dependencies
npm install

# Modify the build command to use the polyfill
echo "Original build script in package.json will be used with the polyfill"

# Execute the build with the polyfill injected
NODE_OPTIONS="--require ./crypto-polyfill.cjs" npm run build || {
  echo "Build failed with polyfill. Attempting alternative approach..."
  # If the first approach fails, try an alternative
  npm install --save-dev crypto-browserify
  NODE_OPTIONS="--no-experimental-fetch" npm run build
}

# Return to the project root
cd ..
