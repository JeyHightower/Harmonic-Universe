#!/bin/bash

# This script verifies the proper configuration for Render.com deployment

echo "Checking Python import paths..."
echo "Working directory: $(pwd)"
echo "Checking if app.models.user can be imported..."

# Try importing the User model
python3 -c "import sys; sys.path.insert(0, '.'); from backend.app.models.user import User; print('User model imported successfully!')" || echo "Failed to import User model from backend path"

# Try with PYTHONPATH set to the project root
PYTHONPATH=$(pwd) python3 -c "from backend.app.models.user import User; print('User model imported successfully with PYTHONPATH!')" || echo "Failed to import User model with PYTHONPATH set"

# Try with direct app path
cd backend
python3 -c "import sys; sys.path.insert(0, '.'); from app.models.user import User; print('User model imported successfully from backend directory!')" || echo "Failed to import User model from inside backend"

echo "Checking gunicorn command configuration..."
echo "Recommended command for Render.com:"
echo "cd /opt/render/project/src && PYTHONPATH=/opt/render/project/src gunicorn backend.app.main:app --log-level info --workers 2 --timeout 120 --access-logfile - --error-logfile -"
