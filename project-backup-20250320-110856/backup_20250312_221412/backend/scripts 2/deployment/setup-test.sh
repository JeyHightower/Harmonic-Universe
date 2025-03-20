#!/bin/bash

# Set up test environment
cd frontend
yarn test:setup
cd ..

cd backend
source venv/bin/activate
python -m pytest --setup-only
cd ..

echo "Test environment setup complete!"
