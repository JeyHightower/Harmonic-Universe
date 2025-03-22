#!/bin/bash

# Root directory cleanup script
# This script cleans up and reorganizes the project root directory

set -e # Exit immediately if a command exits with a non-zero status

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="project-backup-$TIMESTAMP"

echo -e "${GREEN}===== Project Root Cleanup Script =====${NC}"
echo -e "${YELLOW}This script will clean up and reorganize your project root directory.${NC}"
echo -e "${YELLOW}A backup will be created at: ${BACKUP_DIR}${NC}"
echo ""

# Create backup directory
echo -e "${GREEN}Creating backup of project directory...${NC}"
mkdir -p "$BACKUP_DIR"

# Use rsync if available (more reliable with error handling)
if command -v rsync > /dev/null; then
    rsync -av --quiet --exclude "node_modules" --exclude "venv" --exclude "env" --exclude ".git" \
        --exclude "$BACKUP_DIR" --exclude "*.pyc" --exclude "__pycache__" --exclude ".DS_Store" \
        ./ "$BACKUP_DIR/" || {
        echo -e "${RED}Backup failed with rsync, trying cp...${NC}";
        mkdir -p "$BACKUP_DIR/frontend" "$BACKUP_DIR/backend"
        cp -r frontend "$BACKUP_DIR/" 2>/dev/null || true
        cp -r backend "$BACKUP_DIR/" 2>/dev/null || true
        cp package.json "$BACKUP_DIR/" 2>/dev/null || true
        cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
        cp *.md "$BACKUP_DIR/" 2>/dev/null || true
        cp .env* "$BACKUP_DIR/" 2>/dev/null || true
    }
else
    # Fallback to cp with error suppression
    mkdir -p "$BACKUP_DIR/frontend" "$BACKUP_DIR/backend"
    cp -r frontend "$BACKUP_DIR/" 2>/dev/null || true
    cp -r backend "$BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
    cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
    cp *.md "$BACKUP_DIR/" 2>/dev/null || true
    cp .env* "$BACKUP_DIR/" 2>/dev/null || true
fi

echo -e "${GREEN}Backup created successfully.${NC}"

echo -e "${GREEN}Cleaning up root directory...${NC}"

# Remove unnecessary files and directories
find . -maxdepth 1 -name "*.bak" -delete
find . -maxdepth 1 -name "*.tmp" -delete
find . -maxdepth 1 -name ".DS_Store" -delete

# Move misplaced files to appropriate directories
echo -e "${GREEN}Moving misplaced files to correct directories...${NC}"

# Create directories if they don't exist
mkdir -p frontend/src backend/app scripts docs

# Move Python files to backend
for file in *.py; do
    if [ -f "$file" ] && [ "$file" != "setup.py" ]; then
        echo -e "${YELLOW}Moving $file to backend/${NC}"
        mv "$file" backend/ 2>/dev/null || true
    fi
done

# Move JavaScript files to frontend/src
for file in *.js; do
    if [ -f "$file" ] && [ "$file" != "package.json" ] && [ "$file" != "webpack.config.js" ] && [ "$file" != "babel.config.js" ] && [ "$file" != "jest.config.js" ]; then
        echo -e "${YELLOW}Moving $file to frontend/src/${NC}"
        mv "$file" frontend/src/ 2>/dev/null || true
    fi
done

# Move JSX files to frontend/src
for file in *.jsx; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Moving $file to frontend/src/${NC}"
        mv "$file" frontend/src/ 2>/dev/null || true
    fi
done

# Move CSS files to frontend/src
for file in *.css; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Moving $file to frontend/src/styles/${NC}"
        mkdir -p frontend/src/styles
        mv "$file" frontend/src/styles/ 2>/dev/null || true
    fi
done

# Move SCSS files to frontend/src
for file in *.scss; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Moving $file to frontend/src/styles/${NC}"
        mkdir -p frontend/src/styles
        mv "$file" frontend/src/styles/ 2>/dev/null || true
    fi
done

# Move shell scripts to scripts directory
for file in *.sh; do
    if [ -f "$file" ] && [ "$file" != "frontend-cleanup.sh" ] && [ "$file" != "backend-cleanup.sh" ] && [ "$file" != "root-cleanup.sh" ]; then
        echo -e "${YELLOW}Moving $file to scripts/${NC}"
        mv "$file" scripts/ 2>/dev/null || true
    fi
done

# Create a standard README.md if it doesn't exist
if [ ! -f "README.md" ]; then
    echo -e "${GREEN}Creating README.md...${NC}"
    cat > README.md << 'EOF'
# Harmonic Universe

A web application for creating and sharing universes with AI-generated content.

## Project Structure

- `frontend/` - React frontend application
- `backend/` - Flask API backend
- `scripts/` - Utility scripts for development and deployment
- `docs/` - Project documentation

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- npm or yarn
- pip

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend server will start at http://localhost:5001

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend development server will start at http://localhost:3000

## Deployment

This project is configured for deployment on Render.com.
See the deployment instructions in the `docs/deployment.md` file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
EOF
fi

# Create a .gitignore file if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo -e "${GREEN}Creating .gitignore file...${NC}"
    cat > .gitignore << 'EOF'
# Dependencies
node_modules
venv
env
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist
build
*.pyc
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

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE files
.idea
.vscode
*.swp
*.swo

# OS specific
.DS_Store
Thumbs.db

# Backups
*-backup-*
EOF
fi

# Create docs directory if it doesn't exist
mkdir -p docs

# Create a basic deployment.md if it doesn't exist
if [ ! -f "docs/deployment.md" ]; then
    echo -e "${GREEN}Creating docs/deployment.md...${NC}"
    cat > docs/deployment.md << 'EOF'
# Deployment Guide

This guide provides instructions for deploying the Harmonic Universe application on Render.com.

## Prerequisites

- A Render.com account
- A PostgreSQL database (can be created on Render.com)
- The project code in a Git repository

## Environment Variables

The following environment variables need to be set in the Render.com dashboard:

- `DJANGO_SECRET_KEY`: A secret key for the Django application
- `DATABASE_URL`: The URL for the PostgreSQL database
- `DJANGO_SETTINGS_MODULE`: The settings module to use (e.g., `backend.settings.production`)
- `WEB_CONCURRENCY`: The number of workers to use (recommended: 4)
- `PYTHON_VERSION`: The Python version to use (e.g., `3.9.16`)
- `NODE_VERSION`: The Node.js version to use (e.g., `16.20.0`)

## Deployment Steps

1. **Fork or clone the repository**

   Fork the repository on GitHub or clone it to your local machine.

2. **Create a new Web Service on Render**

   - Go to the Render.com dashboard
   - Click "New" > "Web Service"
   - Connect your GitHub repository
   - Set the name to "harmonic-universe"
   - Set the build command to `./scripts/build.sh`
   - Set the start command to `cd backend && gunicorn app:app`
   - Add the environment variables listed above

3. **Configure environment variables**

   In the web service settings, add the environment variables listed above.

4. **Set up the PostgreSQL database**

   - Go to the Render.com dashboard
   - Click "New" > "PostgreSQL"
   - Set the name to "harmonic-universe-db"
   - After creation, copy the Internal Database URL
   - Add it as the `DATABASE_URL` environment variable in your web service

5. **Deploy the application**

   - Click "Manual Deploy" > "Deploy latest commit"
   - Monitor the logs for any issues

## Troubleshooting

- **Database connection issues**: Ensure the `DATABASE_URL` environment variable is correctly set.
- **Static files not loading**: Check the `STATIC_URL` and `STATIC_ROOT` settings in your Django configuration.
- **Application errors**: Check the logs in the Render.com dashboard for error messages.
EOF
fi

echo -e "${GREEN}Done! Project root directory has been cleaned up and reorganized.${NC}"
echo -e "${YELLOW}The original files are backed up in: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}You may need to adjust imports or file paths if files have been moved.${NC}"
