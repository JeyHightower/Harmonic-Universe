#!/bin/bash
set -e

cat > build.sh << 'EOFBUILD'
#!/bin/bash
set -e

echo "===== STARTING BUILD PROCESS ====="
echo "Date: $(date)"

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend

# Create .npmrc to handle peer dependencies
echo "legacy-peer-deps=true" > .npmrc

# Install dependencies with legacy peer deps
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Build the frontend
echo "Building frontend..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Go back to root directory
cd ..

# Create static directory if it doesn't exist
mkdir -p static

# Copy frontend build files to static directory
echo "Copying build files to static directory..."
if [ -d "frontend/dist" ]; then
  cp -r frontend/dist/* static/
elif [ -d "frontend/build" ]; then
  cp -r frontend/build/* static/
else
  echo "WARNING: Could not find build output directory"
  mkdir -p static
  echo "<html><body><h1>Build Error</h1><p>Could not find build output directory</p></body></html>" > static/index.html
fi

echo "===== BUILD PROCESS COMPLETED ====="
echo "Date: $(date)"
EOFBUILD

# Make build.sh executable
chmod +x build.sh
echo "build.sh created successfully"
