#!/bin/bash
set -e

echo "===== MIGRATING FROM REACT-SCRIPTS TO VITE ====="
echo "Date: $(date)"

# Navigate to frontend directory
cd frontend

# Backup important files
echo "Creating backups of important files..."
mkdir -p backups
cp package.json backups/package.json.backup
cp -r public backups/public.backup
cp -r src backups/src.backup

# Install Vite and related dependencies
echo "Installing Vite and related dependencies..."
npm install --save-dev vite@5.0.0 @vitejs/plugin-react@4.2.0 --legacy-peer-deps

# Create Vite configuration file
echo "Creating Vite configuration..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Add any path aliases your project uses
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'build', // Match CRA output directory
    assetsDir: 'static', // Where to place assets
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split larger dependencies into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 3000, // Match CRA default port
    open: true,
    proxy: {
      // Add any backend API proxying
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
EOF

# Create index.html in the root directory (required by Vite)
echo "Creating index.html entry point for Vite..."
if [ -f public/index.html ]; then
  # Modify existing index.html for Vite
  cat public/index.html | sed 's|%PUBLIC_URL%/|/|g' | \
    sed '/<\/head>/i \ \ <script type="module" src="/src/index.js"></script>' \
    > index.html
else
  # Create a default index.html if none exists
  cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harmonic Universe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.js"></script>
  </body>
</html>
EOF
fi

# Create .env file for environment variables
echo "Creating .env file for Vite..."
cat > .env << 'EOF'
# Vite environment variables must be prefixed with VITE_
# This ensures compatibility with your existing env vars
VITE_APP_DEBUG=true

# Add other environment variables your app needs
EOF

# Update package.json to use Vite instead of react-scripts
echo "Updating package.json to use Vite..."
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // Save the old dependencies
  const oldDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Update scripts
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.start = 'vite';
  pkg.scripts.build = 'vite build';
  pkg.scripts['render-build'] = 'vite build';
  pkg.scripts.preview = 'vite preview';
  pkg.scripts.dev = 'vite';

  // Remove react-scripts from dependencies if it exists
  if (pkg.dependencies && pkg.dependencies['react-scripts']) {
    delete pkg.dependencies['react-scripts'];
  }

  // Add any missing react dependencies
  if (!pkg.dependencies) pkg.dependencies = {};
  if (!pkg.dependencies['react']) pkg.dependencies['react'] = '^18.2.0';
  if (!pkg.dependencies['react-dom']) pkg.dependencies['react-dom'] = '^18.2.0';

  // Write updated package.json
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Check for and modify problematic imports
echo "Checking for env and process references in code files..."
for jsfile in $(find src -name "*.js" -o -name "*.jsx"); do
  # Check and replace process.env with import.meta.env
  if grep -q "process.env" "$jsfile"; then
    echo "Updating process.env references in $jsfile to use import.meta.env..."
    sed -i.bak 's/process.env.REACT_APP_/import.meta.env.VITE_/g' "$jsfile"
    rm "$jsfile.bak" 2>/dev/null || true
  fi
done

# Move public assets if needed
if [ -d "public" ] && [ ! -f "public.moved" ]; then
  echo "Moving public assets for Vite compatibility..."
  # Copy public files to assets directory
  mkdir -p public/assets
  cp -r public/* public/assets/ 2>/dev/null || true
  touch public.moved
fi

echo "===== VITE MIGRATION COMPLETE ====="
echo "You can now run your app with the following commands:"
echo "  npm run dev    - Start development server"
echo "  npm run build  - Build for production"
echo "  npm run preview - Preview production build"
echo
echo "IMPORTANT: You may need to adjust some imports or configurations based on your specific setup."
echo "Check the Vite documentation for more details: https://vitejs.dev/guide/"
echo
echo "If you have issues with the migration, the backup files are in the 'backups' directory."
