#!/usr/bin/env node

// ES Module build script for Render.com
import { execSync } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current module's path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting ESM build process...');

// Set environment variables
process.env.ROLLUP_SKIP_NODEJS_NATIVE_BUILD = 'true';
process.env.ROLLUP_NATIVE_PURE_JS = 'true';
process.env.ROLLUP_DISABLE_NATIVE = 'true';
process.env.VITE_SKIP_ROLLUP_NATIVE = 'true';
process.env.VITE_PURE_JS = 'true';
process.env.VITE_FORCE_ESM = 'true';

// Clean problematic directories
console.log('🧹 Cleaning problematic directories...');
const dirsToClean = ['dist', '.vite', 'node_modules/.vite', 'node_modules/.cache', 'node_modules/.tmp'];
for (const dir of dirsToClean) {
    try {
        execSync(`rm -rf ${dir}`, { stdio: 'ignore' });
    } catch (err) {
        // Ignore errors
    }
}

// Create minimal vite.config.js if it doesn't exist
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
const rollupDir = path.join(process.cwd(), 'node_modules/rollup/dist');
if (!fs.existsSync(rollupDir)) {
    fs.mkdirSync(rollupDir, { recursive: true });
}

const nativeJs = `
'use strict';

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
};
`;

fs.writeFileSync(path.join(rollupDir, 'native.js'), nativeJs);
console.log('✅ Rollup native module patched');

// Run build
console.log('🔨 Running build...');
try {
    execSync('npx vite@4.5.1 build --mode production', {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=4096 --experimental-vm-modules'
        }
    });
    console.log('✅ Build completed successfully!');
} catch (error) {
    console.error('❌ Build failed:', error.message);

    // Create fallback index.html
    console.log('⚠️ Creating fallback index.html...');
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
