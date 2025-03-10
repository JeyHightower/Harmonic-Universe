#!/bin/bash

# This script should be run during the Render build process
echo "===== UPDATING DEPLOYMENT CONFIGURATION ====="
echo "Date: $(date)"

# Fix script files
./fix-deployment.sh

# Update deployment configuration
echo "Ensuring all scripts are available during deployment..."

# Create a post-build hook to run fixes after each build
cat > post-build.sh << 'EOF'
#!/bin/bash
echo "Running post-build fixes..."
./fix-deployment.sh
echo "Post-build fixes complete"
EOF

chmod +x post-build.sh

# Add to .gitignore to make sure these fixes aren't removed
if [[ -f .gitignore ]]; then
  if ! grep -q "static/react-context-fix.js" .gitignore; then
    echo "# Auto-generated fixes" >> .gitignore
    echo "!static/react-context-fix.js" >> .gitignore
    echo "!static/final-hook-suppressor.js" >> .gitignore
    echo "!post-build.sh" >> .gitignore
  fi
fi

echo "===== DEPLOYMENT CONFIGURATION UPDATED ====="
