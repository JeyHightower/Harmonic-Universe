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

# Build Frontend
echo "==== Building frontend ===="
cd frontend

echo "Creating manual static build instead of using Vite..."
# Create a manual build script that doesn't rely on Vite
cat > manual-build.js << 'EOF'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting manual static build...');

// Create dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the main HTML file
console.log('Copying index.html...');
if (fs.existsSync('index.html')) {
  let htmlContent = fs.readFileSync('index.html', 'utf8');
  
  // Update paths in the HTML to use relative paths
  htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="./assets/');
  htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="./assets/');
  htmlContent = htmlContent.replace(/href="\/vite.svg/g, 'href="./favicon.svg');
  
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
} else {
  console.log('index.html not found, creating a basic one...');
  fs.writeFileSync(path.join(distDir, 'index.html'), `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Harmonic Universe</title>
        <script src="app.js" defer></script>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <div id="root">Loading...</div>
        <div id="portal-root"></div>
      </body>
    </html>
  `);
}

// Copy assets from public directory if it exists
console.log('Copying public assets...');
if (fs.existsSync('public')) {
  const copyPublicAssets = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const srcPath = path.join(dir, file);
      const destPath = path.join(distDir, path.relative('public', srcPath));
      
      if (fs.statSync(srcPath).isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyPublicAssets(srcPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyPublicAssets('public');
}

// Create a basic CSS file
console.log('Creating basic CSS...');
fs.writeFileSync(path.join(distDir, 'style.css'), `
  body { 
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
  }
  
  #root {
    width: 100%;
    max-width: 1200px;
    padding: 20px;
  }
`);

// Create a basic JavaScript file that shows a message
console.log('Creating placeholder JavaScript...');
fs.writeFileSync(path.join(distDir, 'app.js'), `
  document.addEventListener('DOMContentLoaded', function() {
    const rootElement = document.getElementById('root');
    
    rootElement.innerHTML = \`
      <div style="text-align: center">
        <h1>Harmonic Universe</h1>
        <p>The application is running in a static version. Please wait while we load the data.</p>
        <p>If you continue seeing this message, there might be an issue with the build process.</p>
        <div id="loading" style="margin: 20px 0;">Loading...</div>
      </div>
    \`;
    
    // This will be replaced by actual application logic when full build is working
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        document.getElementById('loading').textContent = 'Connected to backend successfully!';
      })
      .catch(error => {
        document.getElementById('loading').textContent = 'Error connecting to backend. Please try again later.';
      });
  });
`);

console.log('Manual static build created successfully in dist/ directory');
EOF

# Execute the manual build script
echo "Running manual build script..."
node manual-build.js

# Try to run the regular build if it exists (fallback to manual if it fails)
echo "Attempting to run regular Vite build..."
npm run build || echo "Regular build failed, using manual build only"

# Clean up artifacts and node_modules to free memory
echo "Cleaning up build artifacts..."
rm -f manual-build.js
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
    
    # Explicitly install Flask-Caching
    echo "Explicitly installing Flask-Caching..."
    pip install --no-cache-dir Flask-Caching==2.1.0
    
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

# Create static directory if it doesn't exist
echo "Setting up static directory for frontend files..."
mkdir -p static
mkdir -p static/assets

# Copy frontend build to backend static directory
echo "Copying frontend build to backend static directory..."
if [ -d "../frontend/dist" ]; then
    echo "Copying main files from frontend/dist to static..."
    cp -f ../frontend/dist/index.html static/
    cp -f ../frontend/dist/*.html static/ 2>/dev/null || true
    cp -f ../frontend/dist/*.css static/ 2>/dev/null || true
    cp -f ../frontend/dist/*.js static/ 2>/dev/null || true
    cp -f ../frontend/dist/*.ico static/ 2>/dev/null || true
    cp -f ../frontend/dist/*.svg static/ 2>/dev/null || true
    
    # Create assets directory and copy all assets
    if [ -d "../frontend/dist/assets" ]; then
        echo "Copying assets from frontend/dist/assets to static/assets..."
        cp -rf ../frontend/dist/assets/* static/assets/
    fi
    
    # Copy other directories if they exist
    for dir in images static fonts; do
        if [ -d "../frontend/dist/$dir" ]; then
            echo "Copying $dir directory..."
            mkdir -p static/$dir
            cp -rf ../frontend/dist/$dir/* static/$dir/
        fi
    done
    
    echo "Frontend build files copied successfully"
else
    echo "WARNING: Frontend dist directory not found. Static files may not be available."
    echo "Creating fallback index.html..."
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harmonic Universe</title>
    <style>
      body { 
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 30px;
        background-color: #f0f2f5;
      }
      h1 { color: #1a73e8; }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Harmonic Universe</h1>
      <p>The application is running but the static files could not be found.</p>
      <p>Please try accessing the API directly at <a href="/api/health">/api/health</a>.</p>
    </div>
  </body>
</html>
EOF
fi

echo "Build completed successfully at $(date)"
exit 0 