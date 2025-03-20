#!/bin/bash

# Setup script for storyboard functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up storyboard functionality...${NC}"

# Create necessary directories
echo "Creating directories..."
mkdir -p frontend/src/components/Storyboard
mkdir -p frontend/src/pages/Storyboard
mkdir -p frontend/src/__tests__/components/Storyboard
mkdir -p backend/app/models
mkdir -p backend/app/routes
mkdir -p backend/tests/routes

# Copy storyboard components
echo "Setting up frontend components..."
cp frontend/src/components/Storyboard/StoryboardEditor.jsx frontend/src/components/Storyboard/
cp frontend/src/components/Storyboard/SceneManager.jsx frontend/src/components/Storyboard/
cp frontend/src/components/Storyboard/TimelineControls.jsx frontend/src/components/Storyboard/

# Copy storyboard pages
echo "Setting up frontend pages..."
cp frontend/src/pages/Storyboard/StoryboardList.jsx frontend/src/pages/Storyboard/
cp frontend/src/pages/Storyboard/StoryboardDetail.jsx frontend/src/pages/Storyboard/
cp frontend/src/pages/Storyboard/StoryboardEdit.jsx frontend/src/pages/Storyboard/

# Copy backend models
echo "Setting up backend models..."
cp backend/app/models/storyboard.py backend/app/models/
cp backend/app/models/scene.py backend/app/models/
cp backend/app/models/visual_effect.py backend/app/models/
cp backend/app/models/audio_track.py backend/app/models/

# Copy backend routes
echo "Setting up backend routes..."
cp backend/app/routes/storyboard.py backend/app/routes/

# Copy tests
echo "Setting up tests..."
cp backend/tests/routes/test_storyboard.py backend/tests/routes/
cp frontend/src/__tests__/components/Storyboard/StoryboardEditor.test.jsx frontend/src/__tests__/components/Storyboard/
cp frontend/src/__tests__/components/Storyboard/SceneManager.test.jsx frontend/src/__tests__/components/Storyboard/
cp frontend/src/__tests__/components/Storyboard/TimelineControls.test.jsx frontend/src/__tests__/components/Storyboard/

# Run database migrations
echo "Running database migrations..."
cd backend
flask db upgrade
cd ..

# Install dependencies
echo "Installing dependencies..."
cd frontend
npm install react-beautiful-dnd styled-components
cd ..

cd backend
pip install -r requirements.txt
cd ..

# Run tests
echo "Running tests..."
cd frontend
npm test -- --watchAll=false
cd ..

cd backend
pytest tests/routes/test_storyboard.py
cd ..

echo -e "${GREEN}Storyboard setup complete!${NC}"
echo -e "${YELLOW}Please check the setup logs for any errors.${NC}"
