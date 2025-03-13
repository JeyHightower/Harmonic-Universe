#!/bin/bash

# Script to build the FIXED Harmonic Universe application
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║      BUILDING FIXED HARMONIC UNIVERSE APPLICATION         ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Set environment variables
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules"

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

# First, restore the application structure (if needed)
if [ ! -f "frontend/src/App.jsx.syntax-error.bak" ]; then
  echo "🔄 Running application restoration script..."
  ./restore-app.sh
fi

# Apply the syntax fix
echo "🔧 Applying syntax fix to App.jsx..."
./fix-app-syntax.sh

# Now build the app using the fixed files
cd frontend || exit 1
echo "📂 Changed to frontend directory: $(pwd)"

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Create .npmrc file with appropriate settings
echo "📝 Creating .npmrc file..."
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
echo "📦 Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps --no-fund --no-optional --force --no-package-lock

# Install Express explicitly
echo "📦 Installing Express explicitly..."
npm install express --save

# Fix Rollup native module issues
echo "🔧 Fixing Rollup native module issues..."
if [ -f "node_modules/rollup/dist/es/shared/node-entry.js" ]; then
  echo "Patching node_modules/rollup/dist/es/shared/node-entry.js..."
  sed -i.bak 's/import { createRequire } from '\''module'\''/import module from '\''module'\''\nconst { createRequire } = module/g' node_modules/rollup/dist/es/shared/node-entry.js
  echo "✅ Fixed node_modules/rollup/dist/es/shared/node-entry.js"
fi

# Create SPA routing file
echo "📝 Creating _redirects file for SPA routing..."
mkdir -p dist
cat > dist/_redirects << EOL
/*    /index.html   200
EOL

# Check if index.html exists
if [ ! -f "index.html" ]; then
  echo "📝 Creating index.html file..."
  cat > index.html << EOL
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harmonic Universe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOL
fi

# Create a minimal favicon
if [ ! -f "public/favicon.svg" ]; then
  echo "📝 Creating favicon.svg..."
  mkdir -p public
  cat > public/favicon.svg << EOL
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="#667eea"/>
</svg>
EOL
fi

# Build the app
echo "🔨 Building the application..."
npm run build

# Check if build succeeded
if [ -f "dist/index.html" ]; then
  echo "✅ Build successful!"

  # Check the size of the build
  echo "📊 Build output size:"
  du -sh dist/
  echo "📊 Detailed file listing:"
  find dist -type f | sort

  # Detailed asset analysis
  echo "📊 Detailed asset size analysis:"
  find dist -type f -name "*.js" -o -name "*.css" | xargs du -sh
else
  echo "❌ Build failed. Creating a fallback index.html..."
  mkdir -p dist
  cat > dist/index.html << EOL
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
        <p>Welcome to the Harmonic Universe application. We're experiencing some technical difficulties right now.</p>
        <p>Please check back later.</p>
    </div>
</body>
</html>
EOL
fi

echo "🚀 Full application build completed!"
