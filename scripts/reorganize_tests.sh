#!/bin/bash

# Navigate to the frontend directory
cd frontend/src/__tests__

# Create temporary directory for consolidation
mkdir -p temp

# Move core test files to temp
mv setup.js temp/
mv App.test.jsx temp/
mv README.md temp/

# Consolidate store tests
mkdir -p temp/store
cp -r store/* temp/store/

# Consolidate service tests
mkdir -p temp/services
cp -r services/* temp/services/

# Consolidate component tests
mkdir -p temp/components
cp -r components/* temp/components/

# Consolidate page tests
mkdir -p temp/pages
cp -r pages/* temp/pages/

# Consolidate unit tests
mkdir -p temp/unit
cp -r unit/* temp/unit/

# Consolidate integration tests
mkdir -p temp/integration
cp -r integration/* temp/integration/

# Move test utilities to appropriate locations
mkdir -p temp/utils
cp -r utils/* temp/utils/

# Clean up old directories
rm -rf store services components pages unit integration setup e2e cypress __fixtures__ __mocks__ api features hooks utils __test_data__

# Move consolidated files back
mv temp/* .
rm -rf temp

echo "Test reorganization complete!"
