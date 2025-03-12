# Harmonic Universe - Deployment Guide

This guide provides comprehensive instructions for deploying the Harmonic Universe application, addressing common issues with Vite/Rollup on Render.com and other environments.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Common Issues & Solutions](#common-issues--solutions)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Render.com Deployment](#rendercom-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Reference

### Render.com Build Command

```bash
chmod +x render-build-command.sh && ./render-build-command.sh
```

### Render.com Start Command

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

### Local Development Commands

```bash
# Fix build issues:
./fix-build.sh

# Start development server:
cd frontend && npm run dev

# Start backend:
cd backend && python -m app
```

## Common Issues & Solutions

### 1. "Cannot find module 'vite'" Error

**Solution implemented in `render-build-command.sh`:**

- Explicitly installs Vite with a specific version (4.5.1)
- Adds file existence checks before running commands
- Implements multiple fallback methods for building

### 2. "Rollup failed to resolve import" Error

**Solution implemented in `vite.config.js` and build scripts:**

- Configure Vite to bundle external dependencies correctly
- Updated `optimizeDeps` to include critical libraries
- Set `external: []` in rollupOptions to force bundling

### 3. Rollup Linux GNU Module Error

**Solution implemented in `fix-rollup-linux-gnu.sh`:**

- Creates a pure JavaScript implementation configuration
- Patches Rollup native module to force pure JS mode
- Sets environment variables to skip native builds
- Creates a specialized build script for Render.com

### 4. npm Install Errors

**Solution implemented across multiple scripts:**

- Clean removal of node_modules and package-lock.json
- Use of `--no-optional` and `--ignore-scripts` flags
- Implementation of `--legacy-peer-deps` for compatibility
- Specific dependency versions to ensure compatibility

## Environment Variables

### Critical Environment Variables for Render.com

```
# Node.js Version
NODE_VERSION=18.19.0

# Python Version
PYTHON_VERSION=3.11.4

# Rollup/Vite Configuration
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true

# Node Options
NODE_OPTIONS=--no-experimental-fetch --max-old-space-size=4096

# npm Configuration
NPM_CONFIG_OPTIONAL=false
```

## Local Development Setup

### Quick Start

1. Clone the repository
2. Run the fix script:
   ```bash
   ./fix-build.sh
   ```
3. Start the development server:
   ```bash
   cd frontend && npm run dev
   ```
4. In a separate terminal, start the backend:
   ```bash
   cd backend && python -m app
   ```

### Manual Setup

If the quick start doesn't work, follow these steps:

1. Set up the frontend:

   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Create a proper Vite configuration:

   ```bash
   # Copy the special configuration
   cp vite.config.no-rollup.js vite.config.js
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Render.com Deployment

### Setup Instructions

1. Create a new Web Service on Render.com
2. Connect to your repository
3. Configure the service with:
   - **Build Command:** `chmod +x render-build-command.sh && ./render-build-command.sh`
   - **Start Command:** `cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app`
   - **Add all environment variables** from the [Environment Variables section](#environment-variables)

### Alternative Build Approaches

If you encounter issues with the default build command, try these alternatives:

1. **Pure JS Implementation:**

   ```bash
   cd frontend && chmod +x render-pure-js-build.sh && ./render-pure-js-build.sh && cd .. && cp -r frontend/dist/* static/ 2>/dev/null || echo "No dist files found" && cd backend && python -m pip install -r requirements.txt
   ```

2. **Direct Vite Build:**
   ```bash
   chmod +x render-build-direct.sh && ./render-build-direct.sh
   ```

## Troubleshooting

### Vite Module Not Found

If you encounter "Cannot find module 'vite'" errors:

1. Check if the module is correctly installed
2. Try reinstalling with a specific version:
   ```bash
   npm install --no-save vite@4.5.1
   ```
3. Use the `fix-rollup-linux-gnu.sh` script

### Rollup Resolve Errors

If you encounter "Rollup failed to resolve import" errors:

1. Check if the problematic module is installed
2. Update your Vite configuration to handle externals correctly
3. Make sure the module is included in optimizeDeps

### Build Fails on Render.com

1. Check the build logs for specific errors
2. Try the alternative build commands listed above
3. Ensure all environment variables are set correctly
4. Consider deploying the frontend and backend separately

### Local Development Issues

1. Run the `fix-build.sh` script to reset your local environment
2. Check browser console for frontend errors
3. Check terminal output for backend errors
4. Ensure proxy settings in Vite configuration point to correct backend URL

---

## Reference Scripts

The project includes several utility scripts to help with deployment and troubleshooting:

### `fix-build.sh`

- Fixes local build dependency issues
- Creates optimized Vite configuration
- Cleans up previous installations

### `fix-rollup-linux-gnu.sh`

- Addresses Rollup Linux GNU module error
- Creates pure JS implementation configuration
- Patches Rollup native module

### `render-build-command.sh`

- Main build script for Render.com
- Handles dependency resolution
- Provides fallback build methods

### `render-pure-js-build.sh`

- Special build command for Render.com
- Uses pure JS implementation to avoid native module issues
- Sets critical environment variables
