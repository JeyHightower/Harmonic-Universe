#!/usr/bin/env node

/**
 * Simple build script for Render.com that directly uses npx to run Vite
 * instead of trying to dynamically import or require it.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file's path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting simplified Render build process...');

// Ensure environment variables are set to disable native modules
process.env.ROLLUP_SKIP_NODEJS_NATIVE_BUILD = 'true';
process.env.ROLLUP_NATIVE_PURE_JS = 'true';
process.env.ROLLUP_DISABLE_NATIVE = 'true';
process.env.VITE_SKIP_ROLLUP_NATIVE = 'true';
process.env.VITE_PURE_JS = 'true';
process.env.VITE_FORCE_ESM = 'true';

// Clean up function to handle ENOTEMPTY errors
const cleanupNodeModules = () => {
  console.log('🧹 Cleaning problematic directories to prevent ENOTEMPTY errors...');

  try {
    // Remove common problematic directories
    const dirsToClean = [
      'dist',
      '.vite',
      'node_modules/.vite',
      'node_modules/.cache',
      'node_modules/.tmp'
    ];

    dirsToClean.forEach(dir => {
      try {
        execSync(`rm -rf ${dir}`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore errors, continue with other directories
      }
    });

    // Try a deeper clean if needed
    try {
      execSync('find node_modules -type d -name ".vite" -exec rm -rf {} \\; 2>/dev/null || true', { stdio: 'ignore' });
      execSync('find node_modules -type d -name ".cache" -exec rm -rf {} \\; 2>/dev/null || true', { stdio: 'ignore' });
      execSync('find node_modules -type d -name ".tmp" -exec rm -rf {} \\; 2>/dev/null || true', { stdio: 'ignore' });
    } catch (err) {
      // Ignore errors, this is a best-effort cleanup
    }

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.warn('⚠️ Cleanup had some issues, but will continue:', error.message);
  }
};

// Run cleanup before starting
cleanupNodeModules();

// Check if vite is installed
try {
  console.log('📦 Checking for Vite installation...');

  // Ensure Vite is installed
  try {
    execSync('npm list vite', { stdio: 'ignore' });
  } catch (err) {
    console.log('📦 Vite not found, installing...');
    execSync('npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional --ignore-scripts --legacy-peer-deps --prefer-offline',
      { stdio: 'inherit' });
  }

  // Check if vite.config.js exists
  if (!fs.existsSync(path.join(process.cwd(), 'vite.config.js'))) {
    console.log('⚠️ vite.config.js not found, creating a minimal one...');

    const minimalConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This special config disables Rollup native functionality
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
    ],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
          ],
        },
      },
    },
  },
});
`;
    fs.writeFileSync(path.join(process.cwd(), 'vite.config.js'), minimalConfig);
    console.log('✅ Created minimal vite.config.js');
  }

  // Patch rollup native module
  console.log('🔧 Patching Rollup native module...');
  const nativePath = path.join(process.cwd(), 'node_modules/rollup/dist/native.js');

  if (fs.existsSync(path.dirname(nativePath))) {
    const patchedNative = `'use strict';

// This is a patched version that skips native module loading
// and always returns null to force pure JS implementation

Object.defineProperty(exports, '__esModule', { value: true });

// Export patched functions
exports.getDefaultNativeFactory = function() {
  return null;
};

exports.getNativeFactory = function() {
  return null;
};

// Add exports that might be imported by ES modules
exports.parse = function() {
  return null;
};

exports.parseAsync = function() {
  return Promise.resolve(null);
};

// Add xxhash exports
exports.xxhashBase16 = function() {
  return null;
};

exports.xxhashBase64Url = function() {
  return null;
};

exports.xxhashBase36 = function() {
  return null;
};`;

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(nativePath), { recursive: true });

    // Write the patched file
    fs.writeFileSync(nativePath, patchedNative);
    console.log('✅ Rollup native module patched successfully');
  }

  console.log('🔨 Running build with npx vite...');

  try {
    // Try to directly use npx to run vite build
    execSync('npx vite build --mode production', {
      stdio: 'inherit',
      env: {
        ...process.env,
        ROLLUP_SKIP_NODEJS_NATIVE_BUILD: 'true',
        ROLLUP_NATIVE_PURE_JS: 'true',
        ROLLUP_DISABLE_NATIVE: 'true'
      }
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed with npx vite. Trying with a specific version...');

    // Attempt with a specific version of vite
    try {
      execSync('npx vite@4.5.1 build --mode production', {
        stdio: 'inherit',
        env: {
          ...process.env,
          ROLLUP_SKIP_NODEJS_NATIVE_BUILD: 'true',
          ROLLUP_NATIVE_PURE_JS: 'true',
          ROLLUP_DISABLE_NATIVE: 'true'
        }
      });
      console.log('✅ Build with specific Vite version completed successfully!');
    } catch (secondError) {
      console.error('❌ Second build attempt failed. Trying with more specific options...');

      try {
        // One more attempt with more explicit options
        execSync('npx vite@4.5.1 build --mode production --minify=esbuild --assetsInlineLimit=0 --emptyOutDir --outDir=dist', {
          stdio: 'inherit',
          env: {
            ...process.env,
            ROLLUP_SKIP_NODEJS_NATIVE_BUILD: 'true',
            ROLLUP_NATIVE_PURE_JS: 'true',
            ROLLUP_DISABLE_NATIVE: 'true',
            NODE_OPTIONS: '--max-old-space-size=4096 --experimental-vm-modules'
          }
        });
        console.log('✅ Build with specific options completed successfully!');
      } catch (thirdError) {
        console.error('❌ All build attempts failed.');

        // Create a fallback index.html for debugging
        console.log('⚠️ Creating fallback index.html for debugging purposes...');
        const distDir = path.join(process.cwd(), 'dist');

        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe - Build Error</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .error { color: red; background: #ffeeee; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Harmonic Universe - Build Error</h1>
  <div class="error">
    <p>There was an error during the build process. Please check the build logs for details.</p>
    <p>Build time: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;

        fs.writeFileSync(path.join(distDir, 'index.html'), fallbackHtml);
        process.exit(1);
      }
    }
  }

} catch (error) {
  console.error('❌ Build process failed:', error.message);
  process.exit(1);
}
