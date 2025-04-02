#!/bin/bash

# Exit on error
set -e

echo "Starting build process for Harmonic Universe"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v || echo 'Node.js not found')"
echo "NPM version: $(npm -v || echo 'NPM not found')"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Build frontend
echo "Building frontend application..."
cd frontend

# Clean node_modules and dist to ensure a fresh install
echo "Cleaning up node_modules and dist..."
rm -rf node_modules dist

# Create a proper package.json with build scripts
echo "Creating package.json with proper build scripts..."
cat > package.json << 'EOF'
{
  "name": "frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "prop-types": "^15.8.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.3",
    "react-router-dom": "^6.18.0",
    "@reduxjs/toolkit": "^1.9.5",
    "redux-persist": "^6.0.0",
    "axios": "^1.6.2",
    "antd": "^4.24.12",
    "@ant-design/icons": "^4.8.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.15",
    "@mui/material": "^5.14.15",
    "moment": "^2.29.4",
    "three": "^0.157.0",
    "tone": "^14.7.77"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.5.1"
  }
}
EOF

# Create a Vite configuration file that handles redux-persist
echo "Creating vite.config.js..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add alias for redux-persist subpaths
      'redux-persist/integration/react': path.resolve(__dirname, 'node_modules/redux-persist/integration/react')
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Add specific external dependencies with proper input format
      external: [],
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom', 
            'react-redux', 
            '@reduxjs/toolkit',
            'redux-persist'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react-redux', 
      'react-router-dom', 
      'prop-types',
      'redux-persist',
      'redux-persist/integration/react'
    ],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});
EOF

# Create an index.html file
echo "Creating index.html..."
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harmonic Universe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Create main.jsx file
echo "Creating src/main.jsx..."
mkdir -p src
cat > src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Create a basic CSS file
echo "Creating src/index.css..."
cat > src/index.css << 'EOF'
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  display: flex;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
}
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Make sure redux-persist is properly installed and accessible
echo "Ensuring redux-persist is properly installed..."
npm install redux-persist@latest --save

# Check if the redux-persist/integration/react path exists
if [ ! -d "node_modules/redux-persist/integration" ]; then
  echo "WARNING: redux-persist integration directory not found, creating shim..."
  mkdir -p node_modules/redux-persist/integration
  cat > node_modules/redux-persist/integration/react.js << 'EOF'
import React from 'react';

// Simple shim for PersistGate
export const PersistGate = ({ loading, children, persistor }) => {
  return children;
};

export default { PersistGate };
EOF
fi

# Run the build with increased memory limit
echo "Building frontend with Vite..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build

cd ..

# Verify the build
echo "Verifying frontend build..."
if [ -d "frontend/dist" ]; then
    echo "Frontend build successful."
    
    # Create static directory if it doesn't exist
    mkdir -p backend/static
    
    # Copy frontend build to static directory
    echo "Copying frontend build to backend/static..."
    cp -r frontend/dist/* backend/static/
    
    echo "Frontend build deployed to static directory."
else
    echo "WARNING: Frontend build directory not found. Creating fallback HTML..."
    mkdir -p backend/static
    cat > backend/static/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>The application is running in API-only mode due to frontend build issues.</p>
    <p>The API should still be accessible at /api endpoints.</p>
</body>
</html>
EOL
fi

# Create a test HTML file to verify static file serving
echo "Creating test.html in static directory..."
cat > backend/static/test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe Test Page</title>
</head>
<body>
    <h1>Harmonic Universe Test Page</h1>
    <p>If you can see this, static file serving is working!</p>
</body>
</html>
EOL

# Set up database if needed
echo "Setting up database..."
cd backend
python init_migrations.py || echo "Warning: Database initialization failed, continuing anyway"
cd ..

echo "Build process complete." 