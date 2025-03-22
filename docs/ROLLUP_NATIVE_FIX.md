# Fixing Rollup Native Module Error on Render.com

This document explains how to fix the common Rollup native module error that occurs during deployment on Render.com.

## Problem

When deploying to Render.com, you might encounter this error:

```
Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
Require stack:
- /opt/render/project/src/frontend/node_modules/rollup/dist/native.js
```

This error occurs because:

1. Rollup tries to use native modules for better performance
2. These native modules are platform-specific and often fail in cloud environments
3. The build process cannot find the Linux-specific native module for Rollup

## Solution

We've implemented a comprehensive solution to bypass Rollup's native module requirement:

### 1. Environment Variables

Add these environment variables to your build command:

```bash
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true
```

This tells Rollup to use pure JavaScript implementations instead of native modules.

### 2. Installation Flags

When installing dependencies, use the `--ignore-scripts` flag to prevent native compilation:

```bash
npm install --no-optional --ignore-scripts
```

### 3. Fixed Rollup Version

Install a specific version of Rollup that works better in cloud environments:

```bash
npm install --no-save rollup@3.29.4 --no-optional --ignore-scripts
```

### 4. Vite Configuration

Create a special Vite configuration that disables Rollup native functionality:

```javascript
// vite.config.no-rollup.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This special config disables Rollup native functionality
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
          ],
        },
      },
    },
  },
});
```

## Implementation in Build Scripts

Our enhanced `render-build-command.sh` script now includes multiple methods to work around this issue:

```bash
# Method 1: Use npx with fixed version and SKIP_NATIVE flags
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true npx vite@4.5.1 build --mode production --emptyOutDir

# Method 5: Direct config use with no-rollup config
cp vite.config.no-rollup.js vite.config.js
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true npx vite@4.5.1 build --mode production --emptyOutDir
```

## Required Environment Variables

Make sure you have these variables set in Render.com:

```
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
NODE_OPTIONS=--max-old-space-size=4096
```

## Troubleshooting

If you still encounter Rollup errors:

1. **Complete cleanup**: Make sure to completely remove node_modules and package-lock.json before reinstalling
2. **Check Rollup version**: Some versions of Rollup are more problematic with native modules than others
3. **Verify environment variables**: Make sure all the environment variables are correctly set
4. **Direct build command**: Try the most minimal build command:
   ```bash
   ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true \
   npx vite@4.5.1 build --mode production
   ```

## Further Resources

- [Rollup Documentation](https://rollupjs.org/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Render.com Environment Variables](https://render.com/docs/environment-variables)
