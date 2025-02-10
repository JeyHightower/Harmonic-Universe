#!/bin/bash

# Create new directory structure
mkdir -p src/features/{auth,universe,physics,audio,visualization,storyboard,material,scene,ui}
mkdir -p src/shared/{components,hooks,styles,types,utils,api,assets}
mkdir -p src/services/{auth,universe,physics,collaboration,monitoring}
mkdir -p src/config
mkdir -p src/layouts
mkdir -p src/routes
mkdir -p src/store
mkdir -p src/contexts

# Convert JavaScript files to TypeScript
find src -name "*.js" -not -path "*/node_modules/*" | while read file; do
    # Create TypeScript file
    ts_file="${file%.js}.ts"
    cp "$file" "$ts_file"
    # Remove original JS file after successful conversion
    if [ $? -eq 0 ]; then
        rm "$file"
    fi
done

# Move files to appropriate directories
mv src/services/authService.ts src/services/auth/
mv src/services/universeApi.ts src/services/universe/
mv src/services/physicsService.ts src/services/physics/
mv src/services/CollaborationService.ts src/services/collaboration/
mv src/services/monitoring.ts src/services/monitoring/
mv src/services/errorLogging.ts src/services/monitoring/

# Consolidate API files
if [ -f src/services/api.js ] && [ -f src/services/api.ts ]; then
    rm src/services/api.js
fi

# Create index files for better module exports
find src -type d -not -path "*/node_modules/*" -exec touch {}/index.ts \;

echo "Frontend reorganization complete!"
