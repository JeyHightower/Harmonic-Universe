# Deployment Fixes for Harmonic Universe

This document details the fixes implemented to resolve the deployment issues with Harmonic Universe on Render.com.

## Issues Fixed

### 1. Duplicate "start" key in package.json

**Issue:**

```
▲ [WARNING] Duplicate key "start" in object literal [duplicate-object-key]
    package.json:13:4:
      13 │     "start": "vite"
         ╵     ~~~~~~~
  The original key "start" is here:
    package.json:7:4:
      7 │     "start": "vite",
        ╵     ~~~~~~~
```

**Fix:**

- Removed the duplicate "start" key from package.json

### 2. Rollup Linux GNU native module error

**Issue:**

```
Error: Cannot find module @rollup/rollup-linux-x64-gnu. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
```

**Fixes:**

1. Created specialized ES module build script (`frontend/build-render.js`) that:

   - Sets environment variables to force pure JS implementation
   - Uses a render-specific Vite configuration
   - Properly handles errors and provides detailed logging

2. Created Render-specific Vite configuration (`frontend/vite.config.render.js`) that:

   - Avoids using native Rollup modules
   - Configures Rollup to use pure JavaScript implementations
   - Properly handles tree-shaking and dependencies

3. Updated `render-build-command.sh` to:
   - Apply environment variables to disable native modules
   - Create proper .npmrc configuration
   - Patch the Rollup native.js file to force pure JS implementation
   - Implement multiple fallback build methods with increasing levels of degradation
   - Provide a minimal fallback HTML page if all build methods fail

### 3. ES module vs CommonJS confusion

**Issue:**

```
ReferenceError: require is not defined in ES module scope, you can use import instead
This file is being treated as an ES module because it has a '.js' file extension and '/opt/render/project/src/frontend/package.json' contains "type": "module".
```

**Fix:**

- Created build script using proper ES module syntax
- Added proper import statements instead of require()
- Created build-render.js that uses the import syntax for ES modules

## Deployment Steps

1. **Build Command:**

```bash
chmod +x render-build-command.sh && ./render-build-command.sh
```

2. **Start Command:**

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Environment Variables for Render.com

Add these environment variables to your Render.com service:

```
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true
NODE_OPTIONS=--max-old-space-size=4096 --experimental-vm-modules
```

## Testing the Build Locally

To test the build process locally, run:

```bash
./render-build-command.sh
```

This will simulate the Render.com build process on your local machine.
