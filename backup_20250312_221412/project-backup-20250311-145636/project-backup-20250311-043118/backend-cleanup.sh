#!/bin/bash

# backend-cleanup.sh - Comprehensive backend cleanup script
# This script will clean up the backend directory, consolidating nested directories,
# removing redundant files, fixing route conflicts, and properly organizing the codebase.

set -e  # Exit immediately if any command fails

# Check if we're in the project root directory
if [ ! -d "backend" ]; then
  echo "Error: Please run this script from the project root directory."
  exit 1
fi

echo "=== Harmonic Universe Backend Cleanup ==="
echo "This script will clean up the backend directory to fix route conflicts,"
echo "consolidate nested directories, and reorganize into a standard structure."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Create backup of backend directory
BACKUP_DIR="backend-backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup of backend directory to $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

# Use rsync instead of cp for more reliable copying
if command -v rsync &> /dev/null; then
  rsync -a --quiet backend/ "$BACKUP_DIR/" 2>/dev/null
else
  # Fallback to cp with error suppression if rsync is not available
  cp -r backend/* "$BACKUP_DIR/" 2>/dev/null || true
fi
echo "Backup created successfully."

# Clean up Python cache files
echo "Removing Python cache files..."
find backend -name "__pycache__" -type d -exec rm -rf {} +
find backend -name "*.pyc" -type f -delete
find backend -name "*.pyo" -type f -delete
echo "Python cache files removed."

# Remove redundant files
echo "Removing redundant backup and temporary files..."
find backend -name "*.bak" -type f -delete
find backend -name "*.backup" -type f -delete
find backend -name "*.swp" -type f -delete
find backend -name "*.tmp" -type f -delete
echo "Redundant files removed."

# Clean up duplicate .wav files in the backend directory
echo "Cleaning up duplicate .wav files..."
find backend -name "universe_*_music.wav" -type f -delete
echo "Duplicate .wav files removed."

# Create a temporary directory for consolidated files
echo "Creating temporary directory for consolidation..."
TEMP_DIR="backend-temp-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TEMP_DIR"

# Standard Python backend directories
echo "Creating standard directory structure..."
mkdir -p "$TEMP_DIR/app"
mkdir -p "$TEMP_DIR/app/api"
mkdir -p "$TEMP_DIR/app/core"
mkdir -p "$TEMP_DIR/app/db"
mkdir -p "$TEMP_DIR/app/models"
mkdir -p "$TEMP_DIR/app/schemas"
mkdir -p "$TEMP_DIR/app/services"
mkdir -p "$TEMP_DIR/app/utils"
mkdir -p "$TEMP_DIR/app/middleware"
mkdir -p "$TEMP_DIR/app/websocket"
mkdir -p "$TEMP_DIR/app/background"
mkdir -p "$TEMP_DIR/tests"
mkdir -p "$TEMP_DIR/migrations"
mkdir -p "$TEMP_DIR/config"
mkdir -p "$TEMP_DIR/scripts"
mkdir -p "$TEMP_DIR/static"
mkdir -p "$TEMP_DIR/logs"
mkdir -p "$TEMP_DIR/docs"

# Copy core config files
echo "Copying core configuration files..."
cp backend/requirements.txt "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy requirements.txt"
cp backend/.env "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy .env"
cp backend/.env.example "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy .env.example"
cp backend/.flake8 "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy .flake8"
cp backend/pyrightconfig.json "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy pyrightconfig.json"
cp backend/py.typed "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy py.typed"
cp backend/.coveragerc "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy .coveragerc"
cp backend/alembic.ini "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy alembic.ini"
cp backend/Dockerfile "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy Dockerfile"
cp backend/README.md "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy README.md"
cp backend/render.yaml "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy render.yaml"

# Copy main Python files
echo "Copying main Python files..."
cp backend/app.py "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy app.py"
cp backend/run.py "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy run.py"
cp backend/manage.py "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy manage.py"
cp backend/wsgi.py "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy wsgi.py"
cp backend/__init__.py "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy __init__.py"

# Copy deployment scripts
cp backend/deploy.sh "$TEMP_DIR/scripts/" 2>/dev/null || echo "Warning: Could not copy deploy.sh"
cp backend/render_debug.sh "$TEMP_DIR/scripts/" 2>/dev/null || echo "Warning: Could not copy render_debug.sh"
cp backend/render_verify.sh "$TEMP_DIR/scripts/" 2>/dev/null || echo "Warning: Could not copy render_verify.sh"

# Copy directories
echo "Copying test directory..."
if [ -d "backend/tests" ]; then
  cp -r backend/tests/* "$TEMP_DIR/tests/" 2>/dev/null || echo "Warning: Could not copy tests directory"
fi

echo "Copying migrations directory..."
if [ -d "backend/migrations" ]; then
  cp -r backend/migrations/* "$TEMP_DIR/migrations/" 2>/dev/null || echo "Warning: Could not copy migrations directory"
fi

echo "Copying alembic directory..."
if [ -d "backend/alembic" ]; then
  cp -r backend/alembic "$TEMP_DIR/" 2>/dev/null || echo "Warning: Could not copy alembic directory"
fi

echo "Copying static directory..."
if [ -d "backend/static" ]; then
  cp -r backend/static/* "$TEMP_DIR/static/" 2>/dev/null || echo "Warning: Could not copy static directory"
fi

echo "Copying logs directory..."
if [ -d "backend/logs" ]; then
  cp -r backend/logs/* "$TEMP_DIR/logs/" 2>/dev/null || echo "Warning: Could not copy logs directory"
fi

echo "Copying docs directory..."
if [ -d "backend/docs" ]; then
  cp -r backend/docs/* "$TEMP_DIR/docs/" 2>/dev/null || echo "Warning: Could not copy docs directory"
fi

echo "Copying config directory..."
if [ -d "backend/config" ]; then
  cp -r backend/config/* "$TEMP_DIR/config/" 2>/dev/null || echo "Warning: Could not copy config directory"
fi

echo "Copying scripts directory..."
if [ -d "backend/scripts" ]; then
  cp -r backend/scripts/* "$TEMP_DIR/scripts/" 2>/dev/null || echo "Warning: Could not copy scripts directory"
fi

# Consolidate app-related code
echo "Consolidating app directory..."
if [ -d "backend/app" ]; then
  # Copy the entire app directory structure
  cp -r backend/app/* "$TEMP_DIR/app/" 2>/dev/null || echo "Warning: Could not copy app directory"
else
  # If no app directory exists, we need to create one from individual files
  echo "No app directory found. Creating from individual files..."

  # Move core module files
  if [ -d "backend/core" ]; then
    cp -r backend/core/* "$TEMP_DIR/app/core/" 2>/dev/null || echo "Warning: Could not copy core directory"
  fi

  # Find and copy Python files to appropriate directories
  find backend -name "*.py" | while read -r file; do
    base_name=$(basename "$file")

    # Skip already processed files
    if [[ "$file" == *"/app.py" ]] || [[ "$file" == *"/run.py" ]] || [[ "$file" == *"/manage.py" ]] || [[ "$file" == *"/wsgi.py" ]] || [[ "$file" == *"/__init__.py" ]]; then
      continue
    fi

    # Process based on filename or directory
    if [[ "$file" == *"/models/"* ]] || [[ "$base_name" == "models.py" ]]; then
      cp "$file" "$TEMP_DIR/app/models/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/schemas/"* ]] || [[ "$base_name" == "schemas.py" ]]; then
      cp "$file" "$TEMP_DIR/app/schemas/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/api/"* ]] || [[ "$base_name" == "api.py" ]]; then
      cp "$file" "$TEMP_DIR/app/api/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/services/"* ]] || [[ "$base_name" == "services.py" ]]; then
      cp "$file" "$TEMP_DIR/app/services/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/utils/"* ]] || [[ "$base_name" == "utils.py" ]]; then
      cp "$file" "$TEMP_DIR/app/utils/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/middleware/"* ]] || [[ "$base_name" == "middleware.py" ]]; then
      cp "$file" "$TEMP_DIR/app/middleware/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/db/"* ]] || [[ "$base_name" == "database.py" ]]; then
      cp "$file" "$TEMP_DIR/app/db/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/routes"* ]] || [[ "$base_name" == "routes.py" ]]; then
      cp "$file" "$TEMP_DIR/app/api/" 2>/dev/null || echo "Warning: Could not copy $file"
    elif [[ "$file" == *"/tests/"* ]]; then
      cp "$file" "$TEMP_DIR/tests/" 2>/dev/null || echo "Warning: Could not copy $file"
    else
      # For other Python files, put them in the app directory
      cp "$file" "$TEMP_DIR/app/" 2>/dev/null || echo "Warning: Could not copy $file"
    fi
  done
fi

# Check if we have essential files
echo "Checking for essential files..."
MISSING_ESSENTIAL=false

if [ ! -f "$TEMP_DIR/app.py" ] && [ ! -f "$TEMP_DIR/app/main.py" ]; then
  echo "WARNING: No main application file found (app.py or app/main.py)"
  MISSING_ESSENTIAL=true
fi

if [ ! -f "$TEMP_DIR/requirements.txt" ]; then
  echo "WARNING: No requirements.txt found"
  MISSING_ESSENTIAL=true
fi

if [ "$MISSING_ESSENTIAL" = true ]; then
  echo "Some essential files are missing. Consider restoring them from the backup."
else
  echo "All essential files are present."
fi

# Consolidate models from the root directory if they exist
echo "Consolidating models from root directory..."
if [ -d "models" ]; then
  cp -r models/* "$TEMP_DIR/app/models/" 2>/dev/null || echo "Warning: Could not copy root models directory"
fi

# Consolidate schemas from the root directory if they exist
echo "Consolidating schemas from root directory..."
if [ -d "schemas" ]; then
  cp -r schemas/* "$TEMP_DIR/app/schemas/" 2>/dev/null || echo "Warning: Could not copy root schemas directory"
fi

# Consolidate routers from the root directory if they exist
echo "Consolidating routers from root directory..."
if [ -d "routers" ]; then
  cp -r routers/* "$TEMP_DIR/app/api/" 2>/dev/null || echo "Warning: Could not copy root routers directory"
fi

# Replace original backend directory with consolidated version
echo "Replacing original backend directory with consolidated version..."
if [ -d "backend" ]; then
  rm -rf backend
fi
mv "$TEMP_DIR" backend

# Create a new .env file if needed
if [ ! -f "backend/.env" ]; then
  echo "Creating default .env file..."
  echo "DATABASE_URL=sqlite:///app.db" > backend/.env
  echo "SECRET_KEY=development_secret_key" >> backend/.env
  echo "DEBUG=True" >> backend/.env
  echo ".env file created."
fi

echo ""
echo "=== Backend Cleanup Complete ==="
echo "The backend directory has been cleaned up, consolidated, and reorganized"
echo "into a standard Python backend structure."
echo ""
echo "Next steps:"
echo "1. Verify the backend can start with 'python backend/run.py'"
echo "2. Check that all routes are working properly"
echo "3. If you encounter any issues, restore from the backup at $BACKUP_DIR"
echo ""

exit 0
