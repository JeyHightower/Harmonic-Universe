# Create a script to verify static files
echo "Verifying static files..."
mkdir -p backend/static

# Create test HTML file to verify static file serving
echo "Creating test.html..."
cat > backend/static/test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe Test Page</title>
</head>
<body>
    <h1>Harmonic Universe Test Page</h1>
    <p>If you can see this, static file serving is working!</p>
</body>
</html>
EOL

# Check if index.html exists in the build output
echo "Checking for built index.html..."
if [ -f "frontend/dist/index.html" ]; then
    echo "Found index.html in frontend/dist, copying to backend/static..."
    cp -r frontend/dist/* backend/static/
elif [ -f "frontend/build/index.html" ]; then
    echo "Found index.html in frontend/build, copying to backend/static..."
    cp -r frontend/build/* backend/static/
else
    echo "WARNING: Could not find built index.html in standard locations."
    echo "Contents of frontend directory:"
    ls -la frontend
    echo "Contents of frontend/dist directory (if exists):"
    ls -la frontend/dist 2>/dev/null || echo "Directory does not exist"
    echo "Contents of frontend/build directory (if exists):"
    ls -la frontend/build 2>/dev/null || echo "Directory does not exist"
    
    echo "Using manually built files instead."
fi

# Copy necessary files to ensure static assets are available
if [ ! -f "backend/static/index.html" ]; then
    echo "Copying built index.html to backend/static..."
    cp frontend/src/vite-fallback.js backend/static/ 2>/dev/null || echo "No vite-fallback.js found"
    cp backend/static/diagnostic.html backend/static/index.html 2>/dev/null || echo "No diagnostic.html found"
fi

# List the contents of the static directory
echo "Static directory contents:"
ls -la backend/static 