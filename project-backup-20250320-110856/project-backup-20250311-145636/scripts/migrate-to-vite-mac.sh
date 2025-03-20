#!/bin/bash
set -e

echo "===== MIGRATING FROM REACT-SCRIPTS TO VITE (macOS VERSION) ====="
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
  # macOS compatible approach - create a temporary file with the script tag
  echo '<script type="module" src="/src/index.js"></script>' > script_tag.txt

  # Replace %PUBLIC_URL% references
  sed 's|%PUBLIC_URL%/|/|g' public/index.html > temp_index.html

  # Use awk to insert before </head> instead of sed (works on macOS)
  awk '/<\/head>/{system("cat script_tag.txt"); print; next} 1' temp_index.html > index.html

  # Clean up temporary files
  rm script_tag.txt temp_index.html
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
    <script type="module" src="/src/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
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

# Check for and modify problematic imports - macOS compatible version
echo "Checking for env and process references in code files..."
for jsfile in $(find src -name "*.js" -o -name "*.jsx"); do
  # Check if file contains process.env
  if grep -q "process.env" "$jsfile"; then
    echo "Updating process.env references in $jsfile to use import.meta.env..."
    # Use perl instead of sed for better compatibility
    perl -i -pe 's/process\.env\.REACT_APP_/import.meta.env.VITE_/g' "$jsfile"
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
