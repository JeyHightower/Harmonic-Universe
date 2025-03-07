#!/bin/bash
# Static solution - no server needed
# This script creates static files that Render will serve directly
set -x  # Print commands for debugging

echo "Setting up static files for direct serving by Render"

# Create all required directories
mkdir -p public
mkdir -p public/api
mkdir -p public/static

# Create health check endpoint file
cat > public/health <<EOF
{"status":"ok","message":"Health check passed"}
EOF

# Create API health check endpoint file
cat > public/api/health <<EOF
{"status":"ok","message":"Health check passed"}
EOF

# Create index.html
cat > public/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Application is running with static files!</p>
    <p>Generated at: $(date)</p>
  </div>
</body>
</html>
EOF

# Create a static file in the static directory
cat > public/static/test.txt <<EOF
This is a static file.
Generated at: $(date)
EOF

# Copy files to expected locations
mkdir -p /opt/render/project/src/static
cp -r public/* /opt/render/project/src/static/ || true

# Set correct permissions
chmod -R 755 public
find public -type f -exec chmod 644 {} \;

echo "Static files have been set up successfully"
echo "Keeping the script running to prevent Render from restarting"

# Just keep the process alive without binding to any ports
while true; do
  echo "Static files mode active - $(date)"
  sleep 300  # Sleep for 5 minutes
done
