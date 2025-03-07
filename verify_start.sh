#!/bin/bash
# Verification-specific start script
set -x  # Print commands for debugging

echo "Starting verification process..."

# Create static directory and index.html if they don't exist
mkdir -p /opt/render/project/src/static
cat > /opt/render/project/src/static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Harmonic Universe</title></head>
<body><h1>Harmonic Universe</h1><p>Static file served correctly</p></body>
</html>
EOF
chmod 644 /opt/render/project/src/static/index.html

# Create standard and api health endpoints
mkdir -p /opt/render/project/src/static/api
echo '{"status":"ok","message":"Health check passed"}' > /opt/render/project/src/static/health
echo '{"status":"ok","message":"Health check passed"}' > /opt/render/project/src/static/api/health
chmod 644 /opt/render/project/src/static/health
chmod 644 /opt/render/project/src/static/api/health

# Set environment variables
export PORT=10000
export STATIC_DIR=/opt/render/project/src/static

# Start the verification server
echo "Starting verification server on port $PORT"
exec python verify_server.py
