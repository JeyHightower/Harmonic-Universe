#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting import updates...${NC}"

# Update frontend imports
cd frontend/src

# Function to update imports in a file
update_imports() {
    local file=$1
    echo "Updating imports in $file..."

    # Update component imports
    sed -i '' 's|@/components/|@/components/common/|g' "$file"
    sed -i '' 's|@/features/|@/components/features/|g' "$file"

    # Update utility imports
    sed -i '' 's|@/utils/|@/utils/common/|g' "$file"

    # Update service imports
    sed -i '' 's|@/services/|@/services/api/|g' "$file"

    # Update store imports
    sed -i '' 's|@/store/|@/store/slices/|g' "$file"

    # Update asset imports
    sed -i '' 's|@/assets/|@/assets/images/|g' "$file"
}

# Find all JavaScript and TypeScript files
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    update_imports "$file"
done

# Update backend imports
cd ../../backend

# Function to update Python imports
update_python_imports() {
    local file=$1
    echo "Updating imports in $file..."

    # Update model imports
    sed -i '' 's|from app.models|from app.models.base|g' "$file"

    # Update route imports
    sed -i '' 's|from app.routes|from app.routes.api|g' "$file"

    # Update utility imports
    sed -i '' 's|from app.utils|from app.utils.helpers|g' "$file"

    # Update service imports
    sed -i '' 's|from app.services|from app.services.core|g' "$file"
}

# Find all Python files
find . -type f -name "*.py" | while read -r file; do
    update_python_imports "$file"
done

echo -e "${GREEN}Import updates complete!${NC}"

# Run tests to verify changes
echo -e "${YELLOW}Running tests to verify changes...${NC}"

# Frontend tests
cd ../frontend
npm test

# Backend tests
cd ../backend
python -m pytest

echo -e "${GREEN}Import update process complete!${NC}"
