# Vite/Rollup Render.com Deployment Solutions

This document summarizes all the solutions implemented to address common issues when deploying Vite/React applications on Render.com, particularly focusing on Rollup native module errors and dependency resolution problems.

## Quick Start

For a complete fix of all issues, run:

```bash
# Make the script executable
chmod +x fix-all.sh

# Run the comprehensive fix script
./fix-all.sh
```

This will:

1. Fix frontend configuration issues
2. Set up backend dependencies
3. Create all necessary deployment scripts
4. Fix npm start script issues

## Common Issues Addressed

### 1. "Cannot find module 'vite'" Error

This error occurs when the Vite module can't be found during the build process on Render.com.

**Solution:**

- Explicit installation of Vite with a specific version (4.5.1)
- File existence checks before running commands
- Multiple fallback methods for building

### 2. "Rollup failed to resolve import" Error

This error occurs when Rollup can't resolve dependencies during the build process.

**Solution:**

- Configured Vite to bundle external dependencies correctly
- Updated `optimizeDeps` to include critical libraries
- Set `external: []` in rollupOptions to force bundling
- Created optimized Vite configuration files

### 3. Rollup Linux GNU Module Error

This error is specific to Linux environments like Render.com's servers, where Rollup tries to use native modules that aren't compatible.

**Solution:**

- Created a pure JavaScript implementation configuration
- Added environment variables to skip native builds
- Created specialized build scripts that avoid native module usage

### 4. npm Start Script Missing

This issue occurs when the npm start script is not defined in package.json.

**Solution:**

- Created a script to update package.json with necessary scripts
- Added Vite-specific scripts for development and production builds

## Available Scripts

### `fix-all.sh`

Comprehensive script that applies all fixes at once.

### `fix-rollup-linux-gnu.sh`

Specifically addresses the Rollup Linux GNU module error.

### `fix-npm-start.sh`

Fixes issues with the npm start script by updating package.json.

### `render-build-command.sh`

Main build script for Render.com that handles dependency resolution and provides fallback methods.

### `render-deploy.sh`

Primary deployment script for Render.com.

## Deployment on Render.com

### Manual Setup

1. Navigate to your Render.com Dashboard
2. Create a new Web Service
3. Connect to your repository
4. Configure with:
   - **Build Command:** `chmod +x render-build-command.sh && ./render-build-command.sh`
   - **Start Command:** `cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app`
   - Add all required environment variables (see below)

### Blueprint Setup (render.yaml)

Alternatively, use the provided `render.yaml` file for quick setup:

```bash
# Clone repository and push to your own GitHub repo
git clone <your-repo-url>
cd <your-repo>

# Apply the fixes
./fix-all.sh

# Push changes to GitHub
git add .
git commit -m "Applied Vite/Rollup deployment fixes"
git push

# Deploy to Render.com using the Blueprint
# Go to Render.com > New > Blueprint
```

## Required Environment Variables

```
NODE_VERSION=18.19.0
PYTHON_VERSION=3.11.4
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true
NODE_OPTIONS=--no-experimental-fetch --max-old-space-size=4096
NPM_CONFIG_OPTIONAL=false
```

## Troubleshooting

If you still encounter issues:

1. **Check build logs:** Identify specific errors in the Render.com build logs
2. **Try pure JS implementation:** Use the `fix-rollup-linux-gnu.sh` script
3. **Deploy frontend separately:** Consider deploying frontend as a static site
4. **Local testing:** Run `./fix-all.sh` locally to test the build before pushing

## Reference Documentation

For more detailed information, refer to:

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment guide
- [render.yaml](./render.yaml) - Blueprint for Render.com deployment
- Individual script files with detailed comments
