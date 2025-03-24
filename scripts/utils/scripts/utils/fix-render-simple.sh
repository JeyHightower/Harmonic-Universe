#!/bin/bash
set -e

# Create or update render.yaml
cat > render.yaml << 'EOFRENDER'
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
EOFRENDER

echo "render.yaml created successfully"
