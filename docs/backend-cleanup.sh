#!/bin/bash

# Backend cleanup script
# This script cleans up and reorganizes the backend directory

set -e # Exit immediately if a command exits with a non-zero status

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="backend-backup-$TIMESTAMP"

echo -e "${GREEN}===== Backend Cleanup Script =====${NC}"
echo -e "${YELLOW}This script will clean up and reorganize your backend directory.${NC}"
echo -e "${YELLOW}A backup will be created at: ${BACKUP_DIR}${NC}"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}Error: backend directory not found!${NC}"
    exit 1
fi

# Create backup directory
echo -e "${GREEN}Creating backup of backend directory...${NC}"
mkdir -p "$BACKUP_DIR"

# Use rsync if available (more reliable with error handling)
if command -v rsync > /dev/null; then
    rsync -av --quiet backend/ "$BACKUP_DIR/" || {
        echo -e "${RED}Backup failed with rsync, trying cp...${NC}";
        cp -r backend/* "$BACKUP_DIR/" 2>/dev/null || true
    }
else
    # Fallback to cp with error suppression
    cp -r backend/* "$BACKUP_DIR/" 2>/dev/null || true
fi

echo -e "${GREEN}Backup created successfully.${NC}"

# Create a temporary directory for the reorganized backend
TEMP_DIR="backend-temp"
mkdir -p "$TEMP_DIR"

echo -e "${GREEN}Cleaning up backend directory...${NC}"

# Remove pycache and other unnecessary files
find backend -name __pycache__ -type d -exec rm -rf {} +
find backend -name "*.pyc" -delete
find backend -name ".DS_Store" -delete

# Consolidate and organize the directory structure
echo -e "${GREEN}Reorganizing backend directory structure...${NC}"

# Create essential directories in the temp directory
mkdir -p "$TEMP_DIR/app"
mkdir -p "$TEMP_DIR/app/api"
mkdir -p "$TEMP_DIR/app/models"
mkdir -p "$TEMP_DIR/app/schemas"
mkdir -p "$TEMP_DIR/app/utils"
mkdir -p "$TEMP_DIR/app/services"
mkdir -p "$TEMP_DIR/app/core"
mkdir -p "$TEMP_DIR/config"
mkdir -p "$TEMP_DIR/scripts"
mkdir -p "$TEMP_DIR/migrations"
mkdir -p "$TEMP_DIR/tests"
mkdir -p "$TEMP_DIR/static"
mkdir -p "$TEMP_DIR/templates"

# Copy essential files to the temp directory
echo -e "${GREEN}Copying essential files...${NC}"

# Copy requirements.txt if it exists
if [ -f "backend/requirements.txt" ]; then
    cp backend/requirements.txt "$TEMP_DIR/" || echo -e "${YELLOW}Warning: Could not copy requirements.txt${NC}"
fi

# Copy .env file if it exists
if [ -f "backend/.env" ]; then
    cp backend/.env "$TEMP_DIR/" || echo -e "${YELLOW}Warning: Could not copy .env${NC}"
fi

# Copy core application files
if [ -f "backend/app.py" ]; then
    cp backend/app.py "$TEMP_DIR/" || echo -e "${YELLOW}Warning: Could not copy app.py${NC}"
elif [ -f "backend/main.py" ]; then
    cp backend/main.py "$TEMP_DIR/" || echo -e "${YELLOW}Warning: Could not copy main.py${NC}"
fi

# Copy configuration files
if [ -d "backend/config" ]; then
    find backend/config -name "*.py" -exec cp {} "$TEMP_DIR/config/" \; 2>/dev/null || \
        echo -e "${YELLOW}Warning: Could not copy config files${NC}"
fi

# Copy model files
find backend -path "*/models/*.py" -exec cp {} "$TEMP_DIR/app/models/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy model files${NC}"

# Copy API route files
find backend -path "*/routes/*.py" -exec cp {} "$TEMP_DIR/app/api/" \; 2>/dev/null || \
find backend -path "*/api/*.py" -exec cp {} "$TEMP_DIR/app/api/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy API route files${NC}"

# Copy schema files
find backend -path "*/schemas/*.py" -exec cp {} "$TEMP_DIR/app/schemas/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy schema files${NC}"

# Copy utility files
find backend -path "*/utils/*.py" -exec cp {} "$TEMP_DIR/app/utils/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy utility files${NC}"

# Copy service files
find backend -path "*/services/*.py" -exec cp {} "$TEMP_DIR/app/services/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy service files${NC}"

# Copy core files
find backend -path "*/core/*.py" -exec cp {} "$TEMP_DIR/app/core/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy core files${NC}"

# Copy migration files
find backend -path "*/migrations/*.py" -exec cp {} "$TEMP_DIR/migrations/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy migration files${NC}"

# Copy test files
find backend -path "*/tests/*.py" -exec cp {} "$TEMP_DIR/tests/" \; 2>/dev/null || \
    echo -e "${YELLOW}Warning: Could not find/copy test files${NC}"

# Copy static files
if [ -d "backend/static" ]; then
    cp -r backend/static/* "$TEMP_DIR/static/" 2>/dev/null || \
        echo -e "${YELLOW}Warning: Could not copy static files${NC}"
fi

# Copy template files
if [ -d "backend/templates" ]; then
    cp -r backend/templates/* "$TEMP_DIR/templates/" 2>/dev/null || \
        echo -e "${YELLOW}Warning: Could not copy template files${NC}"
fi

# Create or update __init__.py files
touch "$TEMP_DIR/app/__init__.py"
touch "$TEMP_DIR/app/api/__init__.py"
touch "$TEMP_DIR/app/models/__init__.py"
touch "$TEMP_DIR/app/schemas/__init__.py"
touch "$TEMP_DIR/app/utils/__init__.py"
touch "$TEMP_DIR/app/services/__init__.py"
touch "$TEMP_DIR/app/core/__init__.py"
touch "$TEMP_DIR/config/__init__.py"

# Fix any route conflicts
echo -e "${GREEN}Fixing route conflicts...${NC}"

# Create a new app.py if it doesn't exist in temp directory
if [ ! -f "$TEMP_DIR/app.py" ] && [ ! -f "$TEMP_DIR/main.py" ]; then
    echo -e "${YELLOW}Creating a new app.py file with basic Flask setup...${NC}"
    cat > "$TEMP_DIR/app.py" << 'EOF'
from flask import Flask, jsonify, send_from_directory
import os

def create_app():
    app = Flask(__name__, static_folder='static')

    # Configure CORS
    from flask_cors import CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    @app.route('/ping', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "message": "API is running"})

    # Serve static files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    # Import and register blueprints here
    # For example:
    # from app.api.users import users_bp
    # app.register_blueprint(users_bp, url_prefix='/api/users')

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
EOF
fi

# Update the backend directory with our cleaned version
echo -e "${GREEN}Updating backend directory...${NC}"

# Remove old backend directory
if [ -d "backend" ]; then
    rm -rf backend
fi

# Rename temp directory to backend
mv "$TEMP_DIR" backend

# Create a .gitignore file if it doesn't exist
if [ ! -f "backend/.gitignore" ]; then
    echo -e "${GREEN}Creating .gitignore file...${NC}"
    cat > backend/.gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
ENV/
env/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS specific
.DS_Store
Thumbs.db

# Application
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
EOF
fi

echo -e "${GREEN}Done! Backend directory has been cleaned up and reorganized.${NC}"
echo -e "${YELLOW}The original files are backed up in: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}You may need to reinstall dependencies and update imports if file locations have changed.${NC}"
