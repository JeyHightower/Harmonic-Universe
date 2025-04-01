#!/bin/bash

# Exit on error
set -e

# Display diagnostic information
echo "Starting build process at $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
python --version

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Set Node memory limit to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=2048"

# Set Node environment and enable crypto polyfill
export NODE_ENV=production
export NODE_POLYFILL_CRYPTO=true
export VITE_SKIP_GET_RANDOM_VALUES=true

# Build Frontend
echo "==== Building frontend ===="
cd frontend
echo "Installing frontend dependencies..."
npm install --no-audit --no-fund

# Create a simplified direct Vite build script
echo "Creating direct Vite build script..."
cat > build-direct.cjs << 'EOF'
console.log('Starting direct Vite build...');

// Polyfill crypto if needed
if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
  global.crypto = {
    getRandomValues: function(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
  console.log('Added crypto.getRandomValues polyfill');
}

// Direct execution without npm scripts
const { execSync } = require('child_process');

try {
  // First attempt - try installing vite globally and running it
  console.log('Attempting direct vite build...');
  
  // Log current directory and available files
  console.log('Current directory:', process.cwd());
  console.log('Loading vite.config.js file...');
  
  // Try a completely different approach using direct command line
  console.log('Executing vite directly via command line...');
  execSync('npm install -g vite@4.0.0 @vitejs/plugin-react@3.0.0', {stdio: 'inherit'});
  execSync('vite build', {stdio: 'inherit'});
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Direct build failed:', error.message);
  console.error('Trying fallback method...');
  
  try {
    // Fallback method - create a minimal vite config and build
    console.log('Creating minimal vite.config.js...');
    const fs = require('fs');
    
    // Create backup of original config
    if (fs.existsSync('./vite.config.js')) {
      fs.copyFileSync('./vite.config.js', './vite.config.js.bak');
    }
    
    // Create simple config file
    fs.writeFileSync('./minimal-vite.config.js', `
      import { defineConfig } from 'vite';
      export default defineConfig({
        root: '.',
        build: {
          outDir: 'dist',
          emptyOutDir: true,
        },
      });
    `);
    
    console.log('Using simplified config with npx...');
    execSync('npx vite build --config minimal-vite.config.js', {stdio: 'inherit'});
    
    // Restore original config
    if (fs.existsSync('./vite.config.js.bak')) {
      fs.copyFileSync('./vite.config.js.bak', './vite.config.js');
      fs.unlinkSync('./vite.config.js.bak');
    }
    
    console.log('Fallback build completed successfully!');
    process.exit(0);
  } catch (fallbackError) {
    console.error('All build methods failed:', fallbackError.message);
    process.exit(1);
  }
}
EOF

# Run the build script with Node's CommonJS mode
echo "Running the direct build script with CommonJS..."
node build-direct.cjs

# Clean up artifacts and node_modules to free memory
echo "Cleaning up build artifacts..."
rm -f build-direct.cjs minimal-vite.config.js vite.config.js.bak
rm -rf node_modules
cd ..

# Build Backend
echo "==== Building backend ===="
cd backend

# Prepare directories
echo "Creating necessary directories..."
mkdir -p instance
mkdir -p logs

# Check if Poetry is installed, if not use pip
if command -v poetry &> /dev/null; then
    echo "Using Poetry for dependency management..."
    # Install Poetry packages
    poetry config virtualenvs.create true
    poetry config virtualenvs.in-project true
    poetry install --only main --no-root

    # Create a .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
    fi
else
    echo "Poetry not found, using pip instead..."
    # Create and activate virtual environment
    python -m venv .venv
    source .venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies with pip..."
    pip install --upgrade pip
    pip install --no-cache-dir -r requirements.txt
    pip install --no-cache-dir gunicorn eventlet
fi

# Validate DATABASE_URL
echo "Validating DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL is not set. Using SQLite as fallback."
    # Ensure app.db exists
    touch app.db
else
    # Fix Postgres URL format if needed
    if [[ $DATABASE_URL == postgres://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgres:///postgresql://}"
        echo "Fixed DATABASE_URL format for PostgreSQL"
    fi
    
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Activate the virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run migrations with error handling
echo "Running database migrations..."
if python -m flask db upgrade; then
    echo "Database migrations completed successfully"
else
    echo "Warning: Database migrations failed. Will attempt to initialize DB on startup."
fi

# Set up environment variables
echo "Setting up environment variables..."
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Copy frontend build to backend static directory if necessary
echo "Copying frontend build to backend static directory..."
mkdir -p static
cp -r ../frontend/dist/* static/

echo "Build completed successfully at $(date)"
exit 0 