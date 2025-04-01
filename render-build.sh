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

# Create Vite build script with fallback options
echo "Creating Vite build script..."
cat > build-frontend.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Polyfill crypto if needed
if (typeof global.crypto === 'undefined' || !global.crypto.getRandomValues) {
  global.crypto = global.crypto || {};
  global.crypto.getRandomValues = function(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };
  console.log('Added crypto.getRandomValues polyfill');
}

const options = { stdio: 'inherit', shell: true };

// Try multiple methods to build the frontend
async function buildWithNpm() {
  return new Promise((resolve, reject) => {
    console.log('Attempting to build with npm run build...');
    const build = spawn('npm', ['run', 'build'], options);
    
    build.on('close', code => {
      if (code === 0) {
        console.log('Build successful with npm run build');
        resolve(true);
      } else {
        console.log(`Build with npm run build failed with code ${code}`);
        resolve(false);
      }
    });
    
    build.on('error', err => {
      console.error('Error running npm build:', err);
      resolve(false);
    });
  });
}

async function buildWithNpx() {
  return new Promise((resolve, reject) => {
    console.log('Attempting to build with npx vite build...');
    const build = spawn('npx', ['vite', 'build'], options);
    
    build.on('close', code => {
      if (code === 0) {
        console.log('Build successful with npx vite build');
        resolve(true);
      } else {
        console.log(`Build with npx vite build failed with code ${code}`);
        resolve(false);
      }
    });
    
    build.on('error', err => {
      console.error('Error running npx build:', err);
      resolve(false);
    });
  });
}

async function buildWithGlobal() {
  return new Promise((resolve, reject) => {
    console.log('Attempting to build with global vite...');
    spawn('npm', ['install', '-g', 'vite@4.0.0'], options).on('close', () => {
      const build = spawn('vite', ['build'], options);
      
      build.on('close', code => {
        if (code === 0) {
          console.log('Build successful with global vite');
          resolve(true);
        } else {
          console.log(`Build with global vite failed with code ${code}`);
          resolve(false);
        }
      });
      
      build.on('error', err => {
        console.error('Error running global vite build:', err);
        resolve(false);
      });
    });
  });
}

// Run all build methods in sequence until one succeeds
async function run() {
  // List files in node_modules to debug
  try {
    console.log('Checking vite installation path...');
    if (fs.existsSync('node_modules/vite')) {
      console.log('Vite directory found. Contents:');
      fs.readdirSync('node_modules/vite').forEach(file => {
        console.log(` - ${file}`);
      });
      
      if (fs.existsSync('node_modules/vite/bin')) {
        console.log('Vite bin directory found. Contents:');
        fs.readdirSync('node_modules/vite/bin').forEach(file => {
          console.log(` - ${file}`);
        });
      } else {
        console.log('No bin directory found in vite module');
      }
    } else {
      console.log('Vite directory not found in node_modules');
    }
  } catch (err) {
    console.error('Error listing vite files:', err);
  }
  
  let success = false;
  
  // Try npm run build first
  success = await buildWithNpm();
  if (success) return 0;
  
  // Try npx vite build next
  success = await buildWithNpx();
  if (success) return 0;
  
  // Last resort, try global vite
  success = await buildWithGlobal();
  if (success) return 0;
  
  console.error('All build methods failed');
  return 1;
}

run().then(exitCode => process.exit(exitCode));
EOF

# Run the build script
echo "Running the build script..."
node build-frontend.js

# Clean up build artifacts
rm -f build-frontend.js

# Clean up node_modules AFTER build to free memory
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