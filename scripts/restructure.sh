#!/bin/bash

# Create temporary directory for restructuring
mkdir -p temp_restructure

# Frontend restructuring
echo "Restructuring frontend..."
mkdir -p temp_restructure/frontend/src/{components,services,__tests__}
mkdir -p temp_restructure/frontend/src/components/{Auth,Universe,Profile,Favorites,Navigation}

# Move frontend files to new structure
cp -r frontend/src/* temp_restructure/frontend/src/ 2>/dev/null
cp frontend/package.json temp_restructure/frontend/
cp frontend/vite.config.js temp_restructure/frontend/
cp frontend/index.html temp_restructure/frontend/

# Organize frontend tests
mkdir -p temp_restructure/frontend/src/__tests__/{unit,integration,e2e}
mv frontend/cypress/e2e/* temp_restructure/frontend/src/__tests__/e2e/ 2>/dev/null
mv frontend/tests/unit/* temp_restructure/frontend/src/__tests__/unit/ 2>/dev/null
mv frontend/tests/integration/* temp_restructure/frontend/src/__tests__/integration/ 2>/dev/null

# Backend restructuring
echo "Restructuring backend..."
mkdir -p temp_restructure/backend/{app,tests}
mkdir -p temp_restructure/backend/app/{models,routes,services,schemas,utils}
mkdir -p temp_restructure/backend/tests/{unit,integration,fixtures}

# Move backend files to new structure
cp -r backend/app/* temp_restructure/backend/app/ 2>/dev/null
cp -r backend/tests/unit/* temp_restructure/backend/tests/unit/ 2>/dev/null
cp -r backend/tests/integration/* temp_restructure/backend/tests/integration/ 2>/dev/null
cp backend/requirements.txt temp_restructure/backend/
cp backend/pytest.ini temp_restructure/backend/
cp backend/.env temp_restructure/backend/
cp backend/config.py temp_restructure/backend/

# Root level organization
echo "Organizing root level..."
mkdir -p temp_restructure/docs
cp -r docs/* temp_restructure/docs/ 2>/dev/null
cp README.md temp_restructure/
cp IMPLEMENTATION_STATUS.md temp_restructure/

# Clean up old directories
echo "Cleaning up..."
rm -rf frontend/frontend
rm -rf frontend/tests
rm -rf frontend/cypress
rm -rf backend/src
rm -rf backend/docs
rm -rf src
rm -rf cypress
rm -rf tests

# Move restructured directories back
echo "Moving restructured directories..."
rm -rf frontend
rm -rf backend
mv temp_restructure/* .
rm -rf temp_restructure

echo "Restructuring complete!"

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'EOL'
# Dependencies
node_modules/
venv/

# Build
dist/
build/
coverage/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# Logs
*.log
logs/

# Cache
__pycache__/
.pytest_cache/
.coverage
coverage.xml
coverage_html_report/

# Database
*.db
*.sqlite3

# Misc
.DS_Store
*.pyc
EOL
fi
