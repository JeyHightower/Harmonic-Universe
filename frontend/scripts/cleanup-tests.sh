#!/bin/bash

# Remove duplicate test directories
rm -rf src/tests
rm -rf src/components/*/__tests__
rm -rf src/features/*/__tests__
rm -rf src/services/__tests__

# Remove duplicate setup files
rm -rf src/setupTests.js
rm -rf src/tests/setupTests.js
rm -rf src/tests/setup
rm -rf src/__tests__/setup/test-setup.js

# Ensure core test directory structure exists
mkdir -p src/__tests__/core
mkdir -p src/__tests__/components
mkdir -p src/__tests__/services
mkdir -p src/__tests__/e2e
mkdir -p src/__tests__/__mocks__

# Move and rename core test files
mv src/__tests__/core/auth.test.js src/__tests__/core/auth.test.js.bak
mv src/__tests__/core/universe.test.js src/__tests__/core/universe.test.js.bak
mv src/__tests__/core/profile.test.js src/__tests__/core/profile.test.js.bak
mv src/__tests__/core/favorites.test.js src/__tests__/core/favorites.test.js.bak

# Move and rename component test files
mv src/__tests__/components/Navigation.test.js src/__tests__/components/Navigation.test.js.bak
mv src/__tests__/components/PrivacySettings.test.js src/__tests__/components/PrivacySettings.test.js.bak
mv src/__tests__/components/ParameterManager.test.js src/__tests__/components/ParameterManager.test.js.bak

# Move and rename service test files
mv src/__tests__/services/websocket.test.js src/__tests__/services/websocket.test.js.bak

# Move and rename e2e test files
mv src/__tests__/e2e/core.test.js src/__tests__/e2e/core.test.js.bak

# Move backed up files back
mv src/__tests__/core/auth.test.js.bak src/__tests__/core/auth.test.js
mv src/__tests__/core/universe.test.js.bak src/__tests__/core/universe.test.js
mv src/__tests__/core/profile.test.js.bak src/__tests__/core/profile.test.js
mv src/__tests__/core/favorites.test.js.bak src/__tests__/core/favorites.test.js

mv src/__tests__/components/Navigation.test.js.bak src/__tests__/components/Navigation.test.js
mv src/__tests__/components/PrivacySettings.test.js.bak src/__tests__/components/PrivacySettings.test.js
mv src/__tests__/components/ParameterManager.test.js.bak src/__tests__/components/ParameterManager.test.js

mv src/__tests__/services/websocket.test.js.bak src/__tests__/services/websocket.test.js

mv src/__tests__/e2e/core.test.js.bak src/__tests__/e2e/core.test.js

# Clean up any empty directories
find src -type d -empty -delete

echo "Test cleanup complete!"
