#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting codebase organization...${NC}"

# Create new directory structure for frontend
echo "Organizing frontend..."
cd frontend
mkdir -p src/{components,pages,hooks,utils,services,assets,styles,config,contexts,store}/{__tests__,types}
mkdir -p src/components/{common,layout,features}
mkdir -p src/assets/{images,icons,fonts}
mkdir -p src/styles/{themes,components}

# Organize components by feature
echo "Organizing components by feature..."
cd src/components
mkdir -p Auth Universe Dashboard Navigation Settings

# Create feature-specific directories
cd features
mkdir -p UniverseCreation PhysicsSimulation UserManagement

# Organize backend structure
cd ../../../..
cd backend
mkdir -p app/{models,routes,services,utils,middleware,config,schemas,validators}
mkdir -p tests/{unit,integration,e2e}

# Create necessary directories if they don't exist
mkdir -p {logs,uploads,static}/{temp,backup}

# Organize documentation
cd ..
mkdir -p docs/{api,deployment,development}

# Create symlinks for commonly accessed directories
ln -s frontend/src/components components
ln -s backend/app app
ln -s docs documentation

# Update permissions
chmod +x *.sh

echo -e "${GREEN}Directory structure has been organized!${NC}"

# Create documentation about the new structure
cat > docs/STRUCTURE.md << EOL
# Project Structure Documentation

## Frontend Structure
\`\`\`
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── common/     # Shared components
│   │   ├── layout/     # Layout components
│   │   └── features/   # Feature-specific components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── services/       # API services
│   ├── assets/         # Static assets
│   ├── styles/         # Global styles
│   ├── config/         # Configuration files
│   ├── contexts/       # React contexts
│   └── store/          # State management
\`\`\`

## Backend Structure
\`\`\`
backend/
├── app/
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration
│   ├── schemas/        # Data schemas
│   └── validators/     # Input validators
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
\`\`\`
EOL

echo -e "${GREEN}Documentation has been created at docs/STRUCTURE.md${NC}"

# Create gitkeep files to preserve empty directories
find . -type d -empty -exec touch {}/.gitkeep \;

echo -e "${GREEN}Codebase organization complete!${NC}"
