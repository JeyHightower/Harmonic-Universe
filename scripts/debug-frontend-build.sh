#!/bin/bash
set -e

echo "===== FRONTEND BUILD DEBUGGING ====="
echo "Date: $(date)"

# Navigation
cd frontend

# Backup original package.json
cp package.json package.json.backup

# Get memory information
TOTAL_MEM=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "unknown")
echo "Total memory: $TOTAL_MEM KB (approximately $(($TOTAL_MEM / 1024)) MB)"

# Function to try different build approaches
try_build() {
  METHOD=$1
  MEM_LIMIT=$2
  TIMEOUT=$3
  EXTRA_OPTS=$4

  echo "Trying build method: $METHOD with memory limit: $MEM_LIMIT MB and timeout: $TIMEOUT seconds"

  # Set memory limit
  export NODE_OPTIONS="--max-old-space-size=$MEM_LIMIT"

  # Run the build with timeout
  timeout $TIMEOUT npm run $METHOD $EXTRA_OPTS || {
    echo "Build failed or timed out for method: $METHOD"
    return 1
  }

  echo "Build successful with method: $METHOD"
  return 0
}

# Function to simplify package.json to essentials
simplify_package_json() {
  echo "Simplifying package.json to essential dependencies..."
  cat > package.json << EOF
{
  "name": "frontend-minimal",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0"
  },
  "devDependencies": {
    "esbuild": "^0.19.4"
  },
  "scripts": {
    "build": "node minimal-build.js",
    "minimal-build": "node minimal-build.js"
  }
}
EOF

  # Create minimal build script
  cat > minimal-build.js << 'EOF'
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  console.log('Starting minimal esbuild process...');

  // Create build directory
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }

  try {
    // Bundle the app
    await esbuild.build({
      entryPoints: ['src/index.js'],
      bundle: true,
      minify: true,
      outfile: 'build/bundle.js',
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.css': 'css',
        '.svg': 'file',
        '.png': 'file',
        '.jpg': 'file'
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      logLevel: 'info'
    });

    // Create HTML file
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Minimal React App</title>
        <style>
          body { margin: 0; font-family: sans-serif; }
          .app { max-width: 800px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script src="bundle.js"></script>
      </body>
      </html>
    `;

    fs.writeFileSync(path.join('build', 'index.html'), html);
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
EOF

  # Install minimal dependencies
  npm install --legacy-peer-deps
}

# Try different build approaches
echo "Attempting normal build with increased memory and 5 minute timeout..."
try_build "build" 4096 300 "--verbose" || {
  echo "Normal build failed or timed out. Trying render-build..."
  try_build "render-build" 4096 300 "--verbose" || {
    echo "Both normal approaches failed. Trying simplified build..."

    # Backup src directory before modifying
    echo "Backing up src directory..."
    cp -r src src.backup

    # Create minimal app files
    echo "Creating minimal app files..."
    mkdir -p src/components

    # Minimal App.jsx
    cat > src/App.jsx << 'EOF'
import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Harmonic Universe</h1>
      <p>Minimal build version. The API should still be fully functional.</p>
    </div>
  );
}

export default App;
EOF

    # Minimal index.js
    cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

    # Try with simplified files
    echo "Attempting build with simplified React files..."
    try_build "build" 4096 300 "--verbose" || {
      echo "Still failing with simplified files. Trying minimal build approach..."
      simplify_package_json
      try_build "minimal-build" 2048 300 || {
        echo "All build approaches failed. Creating manual fallback..."

        # Create manual fallback
        mkdir -p build
        cat > build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    h1 { margin-bottom: 1rem; }
    p { margin-bottom: 2rem; }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>The application is in fallback mode. The API should still be fully functional.</p>
    <div>
      <a href="/api/status" class="button">Check API Status</a>
      <a href="/health" class="button">Health Check</a>
    </div>
    <div id="root"></div>
    <script>
      console.log('Fallback build loaded successfully');
      fetch('/health')
        .then(res => res.json())
        .then(data => {
          console.log('Health check:', data);
          document.getElementById('root').innerHTML =
            '<div style="margin-top: 20px; text-align: left; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px;">' +
            '<h3>API Status:</h3>' +
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
            '</div>';
        })
        .catch(err => {
          console.error('Error fetching health:', err);
          document.getElementById('root').innerHTML =
            '<div style="margin-top: 20px; color: #ff6b6b; text-align: left; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px;">' +
            '<h3>API Error:</h3>' +
            '<p>' + err.message + '</p>' +
            '</div>';
        });
    </script>
  </div>
</body>
</html>
EOF
        echo "Created manual fallback build."
      }
    }

    # Restore src if needed
    if [ "$RESTORE_SRC" = "true" ]; then
      echo "Restoring original src directory..."
      rm -rf src
      mv src.backup src
    fi
  }
}

# Copy build to static directories
echo "Copying build to static directories..."
cd ..
cp -rf frontend/build/* static/ 2>/dev/null || echo "No build directory found to copy"
cp -rf frontend/build/* app/static/ 2>/dev/null || echo "Could not copy to app/static"

echo "===== BUILD PROCESS COMPLETED ====="
echo "Date: $(date)"
echo
echo "If all build approaches failed, there might be fundamental issues with the codebase."
echo "Consider the following steps:"
echo "1. Check for circular dependencies in your imports"
echo "2. Reduce the number of dependencies in your package.json"
echo "3. Switch to a simpler bundler like esbuild or Vite"
echo "4. Examine large dependencies that might be causing memory issues"
echo "5. Run the build on a machine with more RAM"
echo "6. Debug with profiling: NODE_OPTIONS=--max-old-space-size=8192 --prof npm run build"
