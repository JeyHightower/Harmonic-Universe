#!/bin/bash
set -e

echo "===== FIXING JSX EXTENSION ISSUES FOR VITE ====="
echo "Date: $(date)"

cd frontend

# 1. Rename index.js to index.jsx
echo "Renaming JSX files with .js extension to .jsx..."
if [ -f src/index.js ]; then
  echo "Renaming src/index.js to src/index.jsx"
  mv src/index.js src/index.jsx
fi

# Scan for other JSX files with .js extension
echo "Scanning for other React component files that should use .jsx extension..."
for jsfile in $(find src -name "*.js"); do
  # Check if file contains JSX syntax
  if grep -q "React.createElement\|<[A-Za-z]" "$jsfile"; then
    echo "File $jsfile appears to contain JSX, renaming to ${jsfile}x"
    mv "$jsfile" "${jsfile}x"
  fi
done

# 2. Update the vite.config.js to include JSX handling for .js files
echo "Updating Vite configuration to handle JSX in .js files..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
EOF

# 3. Update index.html to point to index.jsx
echo "Updating index.html to reference index.jsx..."
sed -i.bak 's|src="/src/index.js"|src="/src/index.jsx"|g' index.html
rm index.html.bak 2>/dev/null || true

# 4. Update any imports that referenced index.js
echo "Updating imports to use .jsx extension..."
for srcfile in $(find src -name "*.js" -o -name "*.jsx"); do
  # Check if file imports App without extension
  if grep -q "from ['\"]\./App['\"]" "$srcfile"; then
    echo "Updating import in $srcfile to use .jsx extension..."
    perl -i -pe "s/from ['\"]\.\/App['\"]/from '.\/App.jsx'/g" "$srcfile"
  fi

  # Check if file imports index without extension
  if grep -q "from ['\"]\./index['\"]" "$srcfile"; then
    echo "Updating import in $srcfile to use .jsx extension..."
    perl -i -pe "s/from ['\"]\.\/index['\"]/from '.\/index.jsx'/g" "$srcfile"
  fi

  # Update any other imports of .js files that were renamed to .jsx
  for jsxfile in $(find src -name "*.jsx"); do
    # Get the base name without extension
    base=$(basename "$jsxfile" .jsx)
    dir=$(dirname "$jsxfile")
    rel_dir=$(echo "$dir" | sed 's|^src/||')

    if [ "$rel_dir" = "src" ]; then
      rel_dir=""
    else
      rel_dir="$rel_dir/"
    fi

    # Check for imports of this file without extension
    if grep -q "from ['\"].*/$base['\"]" "$srcfile"; then
      echo "Updating import of $base in $srcfile to use .jsx extension..."
      perl -i -pe "s/from ['\"](.*\/)$base['\"]/'from '\$1$base.jsx'/g" "$srcfile"
    fi
  done
done

echo "===== JSX EXTENSION FIXES COMPLETE ====="
echo "Try building again with 'npm run build'"
echo "If you still have issues, you may need to manually update some imports"
