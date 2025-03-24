#!/bin/bash

# Script to update render.yaml to use the new fixed build script
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            UPDATING RENDER.YAML CONFIGURATION             ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
  echo "❌ Error: render.yaml file not found."
  exit 1
fi

# Backup existing render.yaml
echo "📝 Backing up existing render.yaml..."
cp render.yaml render.yaml.bak

# Update render.yaml to use the new build script
echo "🔄 Updating render.yaml to use the new build-full-fixed-app.sh script..."
# Using sed to replace the build command in the frontend service
sed -i.bak 's|buildCommand:.*|buildCommand: "./build-full-fixed-app.sh"|g' render.yaml

# Verify the changes
echo "✅ Updated render.yaml successfully."
echo "📄 Changes made to render.yaml:"
diff render.yaml.bak render.yaml || echo "No differences found. Please check the file manually."

echo "🎉 render.yaml update complete!"
