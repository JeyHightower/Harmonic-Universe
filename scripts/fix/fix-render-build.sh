#!/bin/bash

# Script to properly set up Node.js and run the build process on Render.com

# Install NVM if it's not already installed
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
fi

# Set up NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use the correct Node.js version
echo "Installing and using Node.js 18.19.0..."
nvm install 18.19.0
nvm use 18.19.0

# Check Node.js and npm versions
echo "Node.js version:"
node -v
echo "npm version:"
npm -v

# Detect platform - special handling for macOS
if [[ $(uname) == "Darwin" ]]; then
  echo "🍎 macOS detected, using specialized macOS fix..."
  # Run the macOS-specific fix script
  if [ -f "./fix-macos-enotempty.sh" ]; then
    chmod +x ./fix-macos-enotempty.sh
    ./fix-macos-enotempty.sh
  else
    # If the file doesn't exist but we're on macOS, create and run it
    echo "Creating macOS fix script on-the-fly..."
    cat > ./fix-macos-enotempty.sh << 'EOL'
#!/bin/bash
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          AGGRESSIVE MACOS ENOTEMPTY FIXER                ║"
echo "╚══════════════════════════════════════════════════════════╝"
killall -9 node npm 2>/dev/null || true
sleep 2
rm -rf node_modules
rm -rf frontend/node_modules
npm cache clean --force
rm -f package-lock.json
rm -f frontend/package-lock.json
cd frontend
cat > .npmrc << INNEREOF
fund=false
audit=false
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
loglevel=error
prefer-offline=false
legacy-peer-deps=true
unsafe-perm=true
force=true
no-package-lock=true
registry=https://registry.npmjs.org/
INNEREOF
npm install --no-save vite@4.5.1 --no-fund --no-audit --ignore-scripts --force
npm install --no-save react@18.2.0 react-dom@18.2.0 --no-fund --no-audit --ignore-scripts --force
npm install --no-save @vitejs/plugin-react@4.2.1 --no-fund --no-audit --ignore-scripts --force
npm install express --save --no-fund --no-audit --ignore-scripts --force
echo "✅ MacOS ENOTEMPTY fix completed!"
EOL
    chmod +x ./fix-macos-enotempty.sh
    ./fix-macos-enotempty.sh
  fi

  # For macOS, we'll try a direct build approach
  echo "🏗️ Building on macOS..."
  cd frontend
  # Create minimal vite config if needed
  if [ ! -f "./vite.config.js" ] || ! grep -q "react()" "./vite.config.js"; then
    echo "Creating minimal Vite config..."
    cat > ./vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
  }
});
EOL
  fi

  # Create a simple build script
  cat > ./build.js << 'EOL'
import { build } from 'vite';

async function runBuild() {
  try {
    await build({
      configFile: './vite.config.js',
      mode: 'production',
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

runBuild();
EOL

  # Try to build using the direct approach
  echo "Attempting direct build..."
  node build.js

  # Check dist directory
  if [ -d "./dist" ] && [ -f "./dist/index.html" ]; then
    echo "✅ Build completed successfully!"
  else
    echo "❌ Direct build failed. Creating fallback index.html..."
    mkdir -p dist
    cat > ./dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe application.</p>
        <p>The application is running in fallback mode.</p>
    </div>
</body>
</html>
EOL
  fi

  cd ..
  echo "macOS build process completed."
else
  # For non-macOS platforms (like Render.com's Linux environment)
  # Change to frontend directory
  cd frontend || exit 1
  echo "Changed to frontend directory"

  # Clean up problematic directories
  echo "Cleaning up problematic directories..."
  rm -rf node_modules/.vite node_modules/.cache node_modules/.tmp node_modules/@esbuild 2>/dev/null || true

  # Clean npm cache
  echo "Cleaning npm cache..."
  npm cache clean --force

  # Create .npmrc file with appropriate settings
  echo "Creating .npmrc file..."
  cat > .npmrc << EOL
fund=false
audit=false
loglevel=error
prefer-offline=false
legacy-peer-deps=true
unsafe-perm=true
force=true
no-package-lock=true
EOL

  # Install dependencies
  echo "Installing dependencies..."
  npm install --no-fund --legacy-peer-deps --no-optional --force --no-package-lock

  # Install Express explicitly if not installed
  if ! npm list express >/dev/null 2>&1; then
    echo "Installing Express explicitly..."
    npm install express --save
  fi

  # Install specific versions of Vite and plugin-react
  echo "Installing specific versions of Vite and plugin-react..."
  npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional --legacy-peer-deps --force --no-package-lock

  # Make scripts executable
  echo "Making scripts executable..."
  chmod +x fix-deploy.sh build-render.js esm-build.js fix-enotempty.sh 2>/dev/null || true

  # Run deployment fix script
  echo "Running deployment fix script..."
  ./fix-deploy.sh

  # Build the app
  echo "Building the app..."
  npm run build
fi

echo "Build process completed"
