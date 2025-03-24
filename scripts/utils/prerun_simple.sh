#!/usr/bin/env bash
# Simple prerun script for Render.com deployment
set -e

echo "=== RUNNING DEPLOYMENT SETUP ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version 2>/dev/null || echo 'Not available')"

# Create static directories
STATIC_DIR="/opt/render/project/src/static"
echo "Creating static directories..."
mkdir -p "${STATIC_DIR}"
mkdir -p app/static

# Create a default index.html if one doesn't exist
if [ ! -f "${STATIC_DIR}/index.html" ]; then
  echo "Creating default index.html"
  cat > "${STATIC_DIR}/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    p {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .button {
      display: inline-block;
      background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
      color: white;
      text-decoration: none;
      padding: 0.8rem 1.8rem;
      border-radius: 30px;
      font-weight: bold;
      transition: all 0.3s ease;
      margin: 0.5rem;
    }
    .button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe platform!</p>
    <p>A creative space for music and physics visualization.</p>
    <div>
      <a href="/api/health" class="button">Health Check</a>
    </div>
  </div>
</body>
</html>
EOF
  chmod 644 "${STATIC_DIR}/index.html"
fi

# Verify the static file exists
if [ -f "${STATIC_DIR}/index.html" ]; then
  echo "✅ Static index.html exists ($(wc -c < "${STATIC_DIR}/index.html") bytes)"
else
  echo "❌ ERROR: Static index.html not found"
fi

# Create a symbolic link from app/static to STATIC_DIR
if [ -d "app" ]; then
  ln -sf "${STATIC_DIR}" app/static
  echo "Created symbolic link from ${STATIC_DIR} to app/static"
fi

# Set environment variables
export RENDER=true
export STATIC_DIR="${STATIC_DIR}"
export FLASK_APP=app

echo "=== DEPLOYMENT SETUP COMPLETED ==="
