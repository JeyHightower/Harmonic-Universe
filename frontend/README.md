# Harmonic Universe Frontend

## Complete Error Resolution Guide

This project includes scripts to fix multiple issues, including ESM/CommonJS import problems, npm installation errors, and build configuration issues.

### Common Issues

1. **ESM/CommonJS Import Errors**:

   ```
   Named export 'xxhashBase16' not found. The requested module '../../native.js' is a CommonJS module, which may not support all module.exports as named exports.
   ```

2. **npm ENOTEMPTY Errors**:

   ```
   npm ERR! code ENOTEMPTY
   npm ERR! syscall rename
   npm ERR! ENOTEMPTY: directory not empty, rename '...'
   ```

3. **Missing start script**:
   ```
   npm ERR! Error: Missing script: "start"
   ```

### Quick Fix Solution

For the fastest way to fix all errors, run:

```bash
# For local development
./fix-everything.sh

# For Render.com deployment
./fix-deploy.sh
```

### What the Fix Scripts Do

The `fix-everything.sh` script:

1. Terminates any running npm processes that might be locking files
2. Cleans up node_modules and package-lock.json files
3. Creates an .npmrc file with optimized settings
4. Installs dependencies with special flags to avoid ENOTEMPTY errors
5. Patches Rollup's native.js to include xxhash exports
6. Fixes problematic ES Module imports
7. Creates simplified files to ensure a successful build
8. Sets required environment variables

The `fix-deploy.sh` script:

1. Sets environment variables needed for Render.com
2. Applies the same Rollup patches
3. Creates required SPA routing files for deployment
4. Prepares a test page to verify deployment

### Detailed Fix Instructions

If you prefer to fix issues manually:

1. **For ESM/CommonJS Import Issues**:

   - Patch the native.js file:
     ```bash
     ./patch-rollup.sh
     ```
   - Fix import patterns:
     ```bash
     ./fix-rollup-imports.sh
     ```

2. **For npm ENOTEMPTY Errors**:

   - Clean up and reinstall with special flags:
     ```bash
     rm -rf node_modules package-lock.json
     npm cache clean --force
     npm install --prefer-offline --no-fund --legacy-peer-deps
     ```

3. **For Build and Start Issues**:
   - Use environment variables to disable native modules:
     ```bash
     ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true npm run dev
     ```

### For Render.com Deployment

When deploying to Render.com, add these environment variables:

```
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
NODE_OPTIONS=--max-old-space-size=4096 --experimental-vm-modules
```

And use this build command:

```bash
cd frontend && ./fix-deploy.sh
```

This will ensure that the build process completes successfully without errors.
