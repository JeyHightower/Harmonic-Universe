#!/bin/bash

# Create core test directories
mkdir -p src/__tests__/core
mkdir -p src/__tests__/components
mkdir -p src/__tests__/services
mkdir -p src/__tests__/e2e
mkdir -p src/__tests__/__mocks__

# Move core tests
mv src/components/Auth/__tests__/Auth.test.jsx src/__tests__/core/auth.test.js
mv src/components/Universe/__tests__/Universe.test.jsx src/__tests__/core/universe.test.js
mv src/components/Profile/__tests__/Profile.test.jsx src/__tests__/core/profile.test.js
mv src/components/Favorites/__tests__/Favorites.test.jsx src/__tests__/core/favorites.test.js

# Move component tests
mv src/components/Navigation/__tests__/Navigation.test.jsx src/__tests__/components/Navigation.test.js
mv src/components/Universe/__tests__/PrivacySettings.test.jsx src/__tests__/components/PrivacySettings.test.js
mv src/components/Universe/__tests__/ParameterManager.test.jsx src/__tests__/components/ParameterManager.test.js

# Move service tests
mv src/services/__tests__/websocket.test.js src/__tests__/services/

# Clean up empty test directories
find src -type d -name "__tests__" -empty -delete

# Update imports in test files
find src/__tests__ -type f -name "*.js" -exec sed -i '' 's/\.\.\/\.\.\/components/\.\.\/\.\.\/\.\.\/components/g' {} +
find src/__tests__ -type f -name "*.js" -exec sed -i '' 's/\.\.\/\.\.\/services/\.\.\/\.\.\/\.\.\/services/g' {} +
find src/__tests__ -type f -name "*.js" -exec sed -i '' 's/\.\.\/\.\.\/store/\.\.\/\.\.\/\.\.\/store/g' {} +
