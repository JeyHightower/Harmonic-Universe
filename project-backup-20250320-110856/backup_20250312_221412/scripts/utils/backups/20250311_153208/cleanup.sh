#!/bin/bash

# Clean Python cache files
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type d -name ".pytest_cache" -exec rm -r {} +

# Clean Node modules and build artifacts
rm -rf frontend/node_modules
rm -rf frontend/build
rm -rf frontend/dist

# Clean environment files
find . -type f -name ".env" ! -path "./backend/.env" ! -path "./.env" -delete

# Clean logs
rm -rf logs/*
rm -rf backend/logs/*

# Clean temporary files
find . -type f -name ".DS_Store" -delete
find . -type f -name "*.log" -delete
find . -type f -name "*.swp" -delete
find . -type f -name "*.swo" -delete

# Clean database files
rm -f backend/*.db
rm -f backend/test.db

# Clean coverage reports
rm -rf backend/htmlcov
rm -f backend/.coverage

echo "Cleanup complete!"
