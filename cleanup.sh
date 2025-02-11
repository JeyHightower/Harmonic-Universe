#!/bin/bash

# Remove TypeScript configuration files
rm -f frontend/jsconfig.json
rm -f frontend/tsconfig.json
rm -f frontend/**/*.d.ts

# Remove TypeScript dependencies from package.json
cd frontend
npm uninstall @types/* typescript ts-node ts-jest @typescript-eslint/*

# Consolidate environment files
cd ..
cp .env.example frontend/.env.example
cp .env.example backend/.env.example

# Move frontend documentation to root
mkdir -p docs/frontend
mv frontend/src/docs/* docs/frontend/ 2>/dev/null || true
rm -rf frontend/src/docs

# Clean up TypeScript references in documentation
find docs -type f -name "*.md" -exec sed -i '' 's/\.tsx/\.jsx/g' {} +
find docs -type f -name "*.md" -exec sed -i '' 's/\.ts/\.js/g' {} +
find docs -type f -name "*.md" -exec sed -i '' 's/TypeScript/JavaScript/g' {} +

echo "Cleanup completed successfully!"
