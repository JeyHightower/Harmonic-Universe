#!/bin/bash
set -e

echo "===== FIXING RENDER.YAML CONFIGURATION ====="
echo "Date: $(date)"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
  echo "Creating render.yaml file..."
  cat > render.yaml << 'EOF'
services:
  - type: web
    name: harmonic-universe
    env: python
    buildCommand: ./build.sh
    startCommand: ./start.sh
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.6
      - key: NODE_OPTIONS
        value: --max-old-space-size=4096
      - key: VITE_APP_DEBUG
        value: "true"
EOF
  echo "Created render.yaml file"
else
  echo "render.yaml already exists, ensuring it has proper configurations..."

  # macOS-compatible approach using temporary files
  if ! grep -q "NODE_OPTIONS" render.yaml; then
    echo "Adding NODE_OPTIONS to render.yaml..."

    # Create a temporary file with the new content
    node_options_entry="      - key: NODE_OPTIONS
        value: --max-old-space-size=4096"

    # Use awk to insert at the right position (after envVars:)
    awk '/envVars:/{print; print "'"$node_options_entry"'"; next}1' render.yaml > render.yaml.new
    mv render.yaml.new render.yaml
    echo "Added NODE_OPTIONS to render.yaml"
  fi

  if ! grep -q "VITE_APP_DEBUG" render.yaml; then
    echo "Adding VITE_APP_DEBUG to render.yaml..."

    # Create a temporary file with the new content
    vite_debug_entry="      - key: VITE_APP_DEBUG
        value: \"true\""

    # Use awk to insert at the right position (after envVars:)
    awk '/envVars:/{print; print "'"$vite_debug_entry"'"; next}1' render.yaml > render.yaml.new
    mv render.yaml.new render.yaml
    echo "Added VITE_APP_DEBUG to render.yaml"
  fi
fi

echo "render.yaml contents:"
cat render.yaml

echo "===== RENDER.YAML CONFIGURATION FIXED ====="
