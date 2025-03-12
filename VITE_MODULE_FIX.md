# Fixing Vite Module Not Found Error

This document explains how to fix the "Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'" error that occurs during deployment on Render.com.

## Problem

When deploying to Render.com, you might encounter this error:

```
Error: Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)
    at Module._load (node:internal/modules/cjs/loader:922:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}
Node.js v18.17.0
==> Build failed 😞
```

This happens because:

1. The Vite module is not being installed correctly
2. The path to the Vite binary is incorrect
3. The node_modules directory structure isn't as expected

## Solution

We've implemented a robust solution with multiple fallback methods:

### 1. Updated Build Command Script

The `render-build-command.sh` script now:

- Cleans up previous installations to avoid conflicts
- Installs dependencies with explicit flags
- Verifies Vite installation
- Creates a direct build script that doesn't rely on the CLI
- Tries multiple build methods:
  - Method 1: Using npx with fixed version
  - Method 2: Direct use of module if it exists
  - Method 3: Custom Node script approach
  - Method 4: Global installation approach
- Creates a maintenance page if all build methods fail

### 2. Updated Package.json Scripts

The `render-build` script in `package.json` now tries multiple approaches:

```json
"render-build": "ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production node ./node_modules/vite/bin/vite.js build --mode production --emptyOutDir || npx vite@4.5.1 build --mode production --emptyOutDir"
```

### 3. Fixed npm start Script

We've added a `fix-npm-start.sh` script that ensures the `start` script exists in `package.json`, fixing the "Missing script: 'start'" error.

## How to Use

### For Render.com Deployment

Use this build command in your Render.com dashboard:

```bash
chmod +x render-build-command.sh && ./render-build-command.sh
```

### For Local Development

If you encounter the "Missing script: 'start'" error locally, run:

```bash
./fix-npm-start.sh
```

Then you can start the development server with:

```bash
cd frontend && npm start
```

## Troubleshooting

If you still encounter issues:

1. **Check Vite Version**: Make sure you're using a compatible version of Vite (we recommend 4.5.1)
2. **Verify Node Version**: Ensure you're using Node.js v18.x
3. **Clean Installation**: Try removing node_modules and package-lock.json before reinstalling
4. **Check Environment Variables**: Set these environment variables:
   ```
   NODE_ENV=production
   ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
   VITE_SKIP_ROLLUP_NATIVE=true
   VITE_PURE_JS=true
   VITE_FORCE_ESM=true
   ```

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [Render.com Deployment Guide](https://render.com/docs/deploy-node-express-app)
