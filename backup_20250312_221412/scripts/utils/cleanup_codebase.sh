#!/bin/bash

# Harmonic Universe - Comprehensive Codebase Cleanup Script
# This script cleans up the codebase to establish a single source of truth

set -e # Exit on error
set -u # Exit on undefined variables

echo "====== Starting Codebase Cleanup Process ======"
echo "$(date): Cleanup initiated move to root directory"

cd ../../

# Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Function to backup a file before modifying it
backup_file() {
  local file="$1"
  if [ -f "$file" ]; then
    local backup_path="$BACKUP_DIR/$(dirname "$file" | sed 's/^\.\///')"
    mkdir -p "$backup_path"
    cp -p "$file" "$backup_path/$(basename "$file")"
    echo "Backed up: $file"
  fi
}

# Function to verify a file exists
verify_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "WARNING: File $file does not exist!"
    return 1
  fi
  return 0
}

echo "==== Step 1: Cleaning up duplicate shell scripts ===="

# Create a clean scripts directory for the canonical scripts
mkdir -p ./scripts
echo "Created scripts directory for canonical script versions"

# List of essential scripts to keep
ESSENTIAL_SCRIPTS=(
  "build.sh"
  "start.sh"
  "render_build.sh"
  "start-gunicorn.sh"
  "run_local.sh"
)

# Backup all shell scripts first
for script in *.sh; do
  if [ -f "$script" ]; then
    backup_file "$script"
  fi
done

# Move all essential scripts to the scripts directory
for script in "${ESSENTIAL_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    # If multiple versions exist, use the latest one
    LATEST_VERSION=$(ls -t "$script"* | grep -v "\.bak$\|\.backup$\|\.original$\|\.disabled$" | head -n 1)
    cp "$LATEST_VERSION" "./scripts/$script"
    chmod +x "./scripts/$script"
    echo "Preserved essential script: $script (from $LATEST_VERSION)"
  else
    echo "WARNING: Essential script $script not found!"
  fi
done

# Move all utility scripts to the scripts directory
mkdir -p ./scripts/utils
for script in *fix*.sh *deploy*.sh *cleanup*.sh *verify*.sh; do
  if [ -f "$script" ] && [[ ! "$script" =~ ^fix-all\.sh$ ]]; then
    cp "$script" "./scripts/utils/$(basename "$script")"
    chmod +x "./scripts/utils/$(basename "$script")"
    echo "Moved utility script: $script to scripts/utils/"
  fi
done

# Create a script that loads common utilities
cat > ./scripts/utils/common.sh << 'EOF'
#!/bin/bash
# Common utilities for all scripts

# Exit on error
set -e

# Function to log messages with timestamp
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to ensure a directory exists
ensure_dir() {
  mkdir -p "$1"
}

# Function to check for required environment variables
check_env() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    log "ERROR: Environment variable $var_name is not set!"
    return 1
  fi
  return 0
}
EOF
chmod +x ./scripts/utils/common.sh

echo "==== Step 2: Consolidating static files ===="

# Create a clean static directory structure
mkdir -p ./static/js
mkdir -p ./static/css
mkdir -p ./static/assets
mkdir -p ./static/react-fixes

# Consolidate React fix files to one location
echo "Consolidating React fix files..."
for file in static/*react*.js static/*hook*.js; do
  if [ -f "$file" ] && [ ! -L "$file" ]; then
    backup_file "$file"
    cp "$file" "./static/react-fixes/$(basename "$file")"
    echo "Consolidated React fix file: $file"
  fi
done

# Create symbolic links from the main static directory to the react-fixes directory
for file in ./static/react-fixes/*.js; do
  BASENAME=$(basename "$file")
  if [ ! -L "./static/$BASENAME" ]; then
    ln -sf "$file" "./static/$BASENAME"
    echo "Created symlink for: $BASENAME"
  fi
done

# Consolidate index.html files
if [ -f "./frontend/dist/index.html" ]; then
  backup_file "./static/index.html"
  cp "./frontend/dist/index.html" "./static/index.html"
  echo "Using frontend/dist/index.html as the canonical version"
elif [ -f "./frontend/public/index.html" ]; then
  backup_file "./static/index.html"
  cp "./frontend/public/index.html" "./static/index.html"
  echo "Using frontend/public/index.html as the canonical version"
fi

# Create a simple redirecting index.html for app/static
mkdir -p ./app/static
cat > ./app/static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <meta http-equiv="refresh" content="0;url=/" />
</head>
<body>
  <p>Redirecting to main application...</p>
</body>
</html>
EOF
echo "Created redirecting index.html for app/static"

echo "==== Step 3: Cleaning up JavaScript files ===="

# Remove duplicate JavaScript files
for file in static/index-*.js static/Layout-*.js static/Dashboard-*.js static/Home-*.js; do
  if [ -f "$file" ]; then
    backup_file "$file"
    echo "Backing up duplicate JS file: $file (will be removed)"
  fi
done

# Only keep the latest versions
LATEST_INDEX=$(ls -t static/index-*.js 2>/dev/null | head -n 1)
LATEST_LAYOUT=$(ls -t static/Layout-*.js 2>/dev/null | head -n 1)
LATEST_DASHBOARD=$(ls -t static/Dashboard-*.js 2>/dev/null | head -n 1)
LATEST_HOME=$(ls -t static/Home-*.js 2>/dev/null | head -n 1)

if [ -n "$LATEST_INDEX" ]; then
  cp "$LATEST_INDEX" "./static/js/index.js"
  echo "Kept latest index file: $LATEST_INDEX"
fi

if [ -n "$LATEST_LAYOUT" ]; then
  cp "$LATEST_LAYOUT" "./static/js/Layout.js"
  echo "Kept latest Layout file: $LATEST_LAYOUT"
fi

if [ -n "$LATEST_DASHBOARD" ]; then
  cp "$LATEST_DASHBOARD" "./static/js/Dashboard.js"
  echo "Kept latest Dashboard file: $LATEST_DASHBOARD"
fi

if [ -n "$LATEST_HOME" ]; then
  cp "$LATEST_HOME" "./static/js/Home.js"
  echo "Kept latest Home file: $LATEST_HOME"
fi

# Update the main index.html file to point to the correct JS files
if [ -f "./static/index.html" ]; then
  # Backup before modifying
  backup_file "./static/index.html"

  # Update script references
  sed -i.bak 's|src="\./index-[A-Za-z0-9_-]\+\.js"|src="./js/index.js"|g' "./static/index.html"
  sed -i.bak 's|src="\./Layout-[A-Za-z0-9_-]\+\.js"|src="./js/Layout.js"|g' "./static/index.html"
  sed -i.bak 's|src="\./Dashboard-[A-Za-z0-9_-]\+\.js"|src="./js/Dashboard.js"|g' "./static/index.html"
  sed -i.bak 's|src="\./Home-[A-Za-z0-9_-]\+\.js"|src="./js/Home.js"|g' "./static/index.html"

  # Remove backup file created by sed
  rm -f "./static/index.html.bak"
  echo "Updated index.html to use consolidated JS files"
fi

echo "==== Step 4: Updating Python codebase references ===="

# Update app.py to use the correct static folder path
if [ -f "./app.py" ]; then
  backup_file "./app.py"

  # Update static folder reference
  sed -i.bak "s| app = Flask(__name__, static_folder='static')|app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))|g" "./app.py"
  rm -f "./app.py.bak"
  echo "Updated static folder path in app.py"
fi

# Update app/__init__.py to use the correct static folder path
if [ -f "./app/__init__.py" ]; then
  backup_file "./app/__init__.py"

  # Update static folder reference
  sed -i.bak "s|static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))|static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))|g" "./app/__init__.py"
  rm -f "./app/__init__.py.bak"
  echo "Verified static folder path in app/__init__.py"
fi

# Create a single wsgi.py file if needed
if [ ! -f "./wsgi.py" ] && [ -f "./app/wsgi.py" ]; then
  cp "./app/wsgi.py" "./wsgi.py"
  echo "Created a root wsgi.py file from app/wsgi.py"
fi

echo "==== Step 5: Updating frontend configuration ===="

# Ensure frontend has proper configuration
mkdir -p ./frontend/public
mkdir -p ./frontend/src

# Copy the consolidated index.html to frontend/public if not exists
if [ ! -f "./frontend/public/index.html" ] && [ -f "./static/index.html" ]; then
  cp "./static/index.html" "./frontend/public/index.html"
  echo "Copied consolidated index.html to frontend/public"
fi

# Create symbolic links for critical React fix files in frontend/src/utils if needed
mkdir -p ./frontend/src/utils
for fix_file in ./static/react-fixes/*.js; do
  BASENAME=$(basename "$fix_file")
  if [ ! -f "./frontend/src/utils/$BASENAME" ] && [ ! -L "./frontend/src/utils/$BASENAME" ]; then
    ln -sf "$fix_file" "./frontend/src/utils/$BASENAME"
    echo "Created symlink for $BASENAME in frontend/src/utils"
  fi
done

echo "==== Cleanup Complete! ===="
echo "Backup of original files stored in: $BACKUP_DIR"
echo "All major code duplications have been consolidated"
echo "Next steps: "
echo "1. Verify the application runs correctly with the consolidated files"
echo "2. Remove unnecessary backup files once verified"
echo "3. Update documentation to reflect the new directory structure"
echo "$(date): Cleanup process completed successfully!"
