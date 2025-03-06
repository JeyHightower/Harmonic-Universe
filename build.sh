#!/usr/bin/env bash
# exit on error
set -o errexit

# Run the setup script
./setup.sh

# Check for installed packages
pip list

# Navigate to frontend directory if it exists
if [ -d "frontend" ]; then
  cd frontend

  # Create crypto polyfill file for Node.js
  cat > crypto-polyfill.cjs << 'EOF'
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
EOF

  # Install frontend dependencies
  npm install

  # Build with the polyfill
  NODE_OPTIONS="--require ./crypto-polyfill.cjs" npm run build || {
    echo "Build failed with polyfill. Attempting alternative approach..."
    npm install --save-dev crypto-browserify
    NODE_OPTIONS="--no-experimental-fetch" npm run build
  }

  # Return to the project root
  cd ..
fi
