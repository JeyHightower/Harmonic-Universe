#!/bin/bash

# Build backend
cd backend
source venv/bin/activate
python setup.py build

# Deploy to hosting service
# Add deployment commands here

echo "Backend deployment complete!"
