#!/bin/bash
# deploy-react-fixes.sh - Deploy React error fixes to production
set -e  # Exit on error

echo "===== DEPLOYING REACT ERROR FIXES ====="
echo "Date: $(date)"
echo "Fixing: Context Provider and Hook Issues"

# Check for proper permissions
if [[ "$(id -u)" != "0" && ! -w "/opt/render/project/src" ]]; then
  echo "WARNING: You may need root permissions to write to /opt/render/project/src"
  echo "Consider running this script with sudo if deployment fails"
fi

# Check if files exist
echo "Verifying fix files..."
files=(
  "static/react-error-handler.js"
  "static/react-force-expose.js"
  "static/react-polyfill.js"
  "static/react-context-provider.js"
  "static/hook-fix.js"
  "static/react-version-checker.js"
  "static/react-diagnostics.js"
  "static/index.html"
  "static/manifest.json"
  "static/favicon.ico"
)

essential_files=(
  "static/react-error-handler.js"
  "static/react-force-expose.js"
  "static/react-polyfill.js"
  "static/react-context-provider.js"
  "static/hook-fix.js"
  "static/react-version-checker.js"
  "static/react-diagnostics.js"
  "static/index.html"
)

missing_essential=false
for file in "${essential_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERROR: Essential file $file not found!"
    missing_essential=true
  else
    echo "✅ Essential file $file found"
  fi
done

if [ "$missing_essential" = true ]; then
  echo "Cannot proceed with deployment. Essential files are missing."
  exit 1
fi

# Check for and create placeholder files if needed
for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⚠️ Warning: $file not found."

    # Create placeholders for missing non-essential files
    if [[ "$file" == "static/manifest.json" ]]; then
      echo "Creating placeholder manifest.json..."
      echo '{
  "short_name": "Harmonic Universe",
  "name": "Harmonic Universe",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}' > static/manifest.json
      echo "✅ Created placeholder manifest.json"
    elif [[ "$file" == "static/favicon.ico" ]]; then
      echo "Creating placeholder favicon.ico..."
      touch static/favicon.ico
      echo "✅ Created placeholder favicon.ico"
    elif [[ "$file" == "static/react-diagnostics.js" ]]; then
      echo "⚠️ React diagnostics script is missing. This will affect troubleshooting capabilities."
      echo "Do you want to create a basic version? (y/n)"
      read -r response
      if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Creating basic diagnostics script..."
        cat > static/react-diagnostics.js << 'EOL'
/**
 * Basic React Diagnostics Tool
 */
(function() {
  console.log('[React Diagnostics] Basic version initialized');

  function createButton() {
    const btn = document.createElement('button');
    btn.textContent = 'React Info';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.right = '10px';
    btn.style.zIndex = '9999';
    btn.style.backgroundColor = 'blue';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.padding = '5px 10px';

    btn.onclick = function() {
      alert(
        'React: ' + (window.React ? window.React.version : 'Not loaded') + '\n' +
        'ReactDOM: ' + (window.ReactDOM ? window.ReactDOM.version : 'Not loaded') + '\n' +
        'Root element: ' + (document.getElementById('root') ? 'Found' : 'Not found') + '\n' +
        'Redux context: ' + (window.ReduxContext ? 'Available' : 'Missing') + '\n' +
        'Router context: ' + (window.RouterContext ? 'Available' : 'Missing')
      );
    };

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
EOL
        echo "✅ Created basic diagnostics script"
      fi
    fi
  else
    echo "✅ Non-essential file $file found"
  fi
done

# Check if destination directory exists
DEPLOY_DIR="/opt/render/project/src"
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "ERROR: Deployment directory $DEPLOY_DIR does not exist!"
  echo "This script is designed to deploy to Render.com environments."
  echo "If you're deploying to a different environment, please specify an alternative directory."

  # Ask for an alternative directory
  echo ""
  echo "Would you like to specify an alternative deployment directory? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Please enter the target deployment directory:"
    read -r DEPLOY_DIR
    if [ ! -d "$DEPLOY_DIR" ]; then
      echo "ERROR: Directory $DEPLOY_DIR does not exist!"
      echo "Would you like to create it? (y/n)"
      read -r create_response
      if [[ "$create_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        if mkdir -p "$DEPLOY_DIR"; then
          echo "✅ Created directory $DEPLOY_DIR"
        else
          echo "ERROR: Failed to create directory $DEPLOY_DIR"
          exit 1
        fi
      else
        echo "Deployment cancelled."
        exit 1
      fi
    fi
  else
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Create a timestamp for backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$TIMESTAMP"

# Backup original files
echo "Creating backups in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

for file in "${files[@]}"; do
  if [ -f "$file" ]; then  # Only backup files that exist locally
    TARGET_PATH="$DEPLOY_DIR/$file"
    BACKUP_PATH="$BACKUP_DIR/$(basename "$file")"
    if [ -f "$TARGET_PATH" ]; then
      echo "Backing up $TARGET_PATH to $BACKUP_PATH"
      if ! cp "$TARGET_PATH" "$BACKUP_PATH"; then
        echo "WARNING: Failed to create backup of $TARGET_PATH"
      fi
    else
      echo "No existing file to backup at $TARGET_PATH"
    fi
  fi
done

# Copy files to production location
echo "Copying files to production location..."
for file in "${files[@]}"; do
  if [ -f "$file" ]; then  # Only deploy files that exist
    TARGET_DIR="$(dirname "$DEPLOY_DIR/$file")"
    if [ ! -d "$TARGET_DIR" ]; then
      echo "Creating directory $TARGET_DIR"
      if ! mkdir -p "$TARGET_DIR"; then
        echo "❌ Failed to create directory $TARGET_DIR"
        echo "ERROR: Deployment failed! Check permissions and try again."
        echo "You might need to run this script with sudo."
        exit 1
      fi
    fi

    echo "Deploying $file to $DEPLOY_DIR/$file"
    if cp "$file" "$DEPLOY_DIR/$file"; then
      echo "✅ Successfully deployed $file"
    else
      echo "❌ Failed to deploy $file"
      echo "ERROR: Deployment failed! Check permissions and try again."
      echo "You might need to run this script with sudo."
      exit 1
    fi
  fi
done

echo "===== DEPLOYMENT COMPLETE ====="
echo "React error and context provider fixes successfully deployed to $DEPLOY_DIR"
echo "Backups were saved to $BACKUP_DIR"
echo ""

# Post-deployment actions
echo "===== POST-DEPLOYMENT ACTIONS ====="

# Optional: Update permissions
echo "Would you like to update file permissions to ensure they're readable by the web server? (y/n)"
read -r perm_response
if [[ "$perm_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Setting permissions..."
  find "$DEPLOY_DIR/static" -type f -name "*.js" -exec chmod 644 {} \;
  find "$DEPLOY_DIR/static" -type f -name "*.html" -exec chmod 644 {} \;
  find "$DEPLOY_DIR/static" -type f -name "*.json" -exec chmod 644 {} \;
  find "$DEPLOY_DIR/static" -type f -name "*.ico" -exec chmod 644 {} \;
  echo "✅ Permissions updated"
fi

# Optional: Restart the application server if in Render environment
if [ -f "$DEPLOY_DIR/start.sh" ] && [ -x "$DEPLOY_DIR/start.sh" ]; then
  echo ""
  echo "Would you like to restart the application server? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Restarting application server..."
    cd "$DEPLOY_DIR" && ./start.sh
    echo "Application server restarted"
  else
    echo "Skipping application server restart"
  fi
fi

echo ""
echo "===== NEXT STEPS ====="
echo "1. Clear your browser cache or open an incognito/private window"
echo "2. Visit the application and check for any remaining errors"
echo "3. Look for the 'Show Diagnostics' button in the top-right corner to see detailed React status"
echo "4. Check the browser console for detailed messages"
echo "5. If issues persist, check the diagnostic panel for suggested fixes"
echo "6. The context provider fixes should resolve the React Error #321 and Router/Redux context issues"

echo ""
echo "Deployment completed successfully at $(date)"
exit 0
