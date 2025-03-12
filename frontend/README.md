# Harmonic Universe Frontend

## Deployment Guide

This README contains information about deploying the Harmonic Universe frontend application to Render.com, with special focus on resolving ESM/CommonJS module compatibility issues.

## Quick Fix for ESM/CommonJS Import Issues

If you're experiencing ESM/CommonJS import errors during build or deployment, especially with messages like:

```
ReferenceError: require is not defined in ES module scope
```

Use one of the following approaches:

### 1. Use the fix-deploy.sh Script (Recommended)

```bash
chmod +x fix-deploy.sh
./fix-deploy.sh
```

This script handles multiple issues, including:

- Patching Rollup's native module
- Fixing problematic imports
- Setting necessary environment variables
- Applying a multi-step build process with fallbacks

### 2. Use the ESM-compatible Build Script

```bash
chmod +x esm-build.js
NODE_OPTIONS="--experimental-vm-modules" node esm-build.js
```

This script is specifically written using ES Module syntax to avoid the `require` vs `import` conflicts.

## Fixing ENOTEMPTY Errors

If you encounter ENOTEMPTY errors during npm installation, like:

```
npm ERR! ENOTEMPTY: directory not empty, rename '/path/to/node_modules/@esbuild/darwin-arm64'
```

Use the dedicated fix script:

```bash
chmod +x fix-enotempty.sh
./fix-enotempty.sh
```

This script:

1. Terminates any npm processes that might be locking files
2. Clears npm cache for problematic packages
3. Removes problematic esbuild directories
4. Creates a custom .npmrc file with optimized settings
5. Installs Vite with special flags to avoid ENOTEMPTY errors

After running this script, you can then proceed with the deployment script:

```bash
./fix-deploy.sh
```

## Deployment to Render.com

The project is configured to deploy to Render.com using the `render.yaml` file. The deployment process:

1. Installs dependencies with specific flags to avoid ENOTEMPTY and other npm errors
2. Applies patches to fix ESM/CommonJS compatibility issues
3. Builds the application for production
4. Serves the static files with SPA routing support

## Common Issues and Solutions

### ESM vs CommonJS Module Format

The project uses ES modules (`"type": "module"` in package.json), which means:

- All `.js` files are treated as ES modules by default
- `require()` is not available in ES modules, use `import` instead
- To use CommonJS syntax, rename files to use the `.cjs` extension

### ENOTEMPTY Errors During npm Install

If you encounter ENOTEMPTY errors during npm installation:

```
ENOTEMPTY: directory not empty, rename '...' -> '...'
```

Use these flags during installation:

```bash
npm install --no-fund --legacy-peer-deps --no-optional --ignore-scripts --force --no-package-lock --unsafe-perm
```

Or better yet, use the fix-enotempty.sh script.

### Rollup Native Module Issues

To resolve Rollup native module issues, set these environment variables:

```bash
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
```

## Local Development

For local development:

```bash
npm install
npm run dev
```

## Building for Production

```bash
chmod +x fix-deploy.sh
./fix-deploy.sh
```

Or if you prefer a manual approach:

```bash
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true npm run build
```

## Script Details

### fix-deploy.sh

This script:

- Sets necessary environment variables
- Cleans problematic directories
- Patches Rollup native module
- Fixes ESM/CommonJS import issues
- Creates a simplified Vite configuration
- Tries multiple build approaches with fallbacks

### fix-enotempty.sh

A specialized script for fixing ENOTEMPTY errors that:

- Terminates processes that might be locking files
- Cleans problematic directories and packages
- Creates optimal npm configuration settings
- Installs dependencies with special flags

### esm-build.js

A specialized ES Module build script that:

- Properly handles ES Module syntax
- Patches the Rollup native module
- Provides fallback behavior for failed builds

### build-render.js

A comprehensive build script with:

- Thorough cleanup to prevent ENOTEMPTY errors
- Multiple build attempts with different configurations
- Fallback error pages for debugging
