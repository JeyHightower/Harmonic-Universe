# Fixing Vite and Rollup Module Errors on Render.com

This document explains how to fix common module errors that occur during deployment on Render.com, including:

1. "Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'"
2. "Cannot find module '@rollup/rollup-linux-x64-gnu'"
3. "require is not defined in ES module scope"

## Problems

When deploying to Render.com, you might encounter these errors:

### 1. Vite Module Not Found

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

### 2. Rollup Native Module Error

```
Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
Require stack:
- /opt/render/project/src/frontend/node_modules/rollup/dist/native.js
```

### 3. ES Module Compatibility Error

```
ReferenceError: require is not defined in ES module scope, you can use import instead
This file is being treated as an ES module because it has a '.js' file extension and '/opt/render/project/src/frontend/package.json' contains "type": "module".
```

## Solution

We've implemented a robust solution with multiple fallback methods:

### 1. Updated Build Command Script

The `render-build-command.sh` script now:

- Sets additional environment variables to handle Rollup native modules:
  ```bash
  export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
  export ROLLUP_NATIVE_PURE_JS=true
  export ROLLUP_DISABLE_NATIVE=true
  export VITE_SKIP_ROLLUP_NATIVE=true
  export VITE_PURE_JS=true
  export VITE_FORCE_ESM=true
  ```
- Creates both CommonJS (.cjs) and ES Module (.mjs) build scripts to handle different module systems
- Implements a special Vite config that disables Rollup native functionality
- Uses multiple build methods with proper module flags:
  - Method 1: Using npx with fixed version and SKIP_NATIVE flags
  - Method 2: Direct use of module if it exists
  - Method 3: CommonJS script approach
  - Method 4: ES Module script approach
  - Method 5: Direct config use with disabled Rollup native
  - Method 6: Minimal build fallback with static HTML/JS/CSS

### 2. Updated Package.json Scripts

The `render-build` script in `package.json` uses multiple approaches:

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

1. **Check Vite & Rollup Versions**: Make sure you're using compatible versions (we recommend Vite 4.5.1 and Rollup 3.29.4)
2. **Verify Node Version**: Ensure you're using Node.js v18.x
3. **Clean Installation**: Try removing node_modules and package-lock.json before reinstalling
4. **Check Environment Variables**: Set these environment variables:
   ```
   NODE_ENV=production
   ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
   ROLLUP_NATIVE_PURE_JS=true
   ROLLUP_DISABLE_NATIVE=true
   VITE_SKIP_ROLLUP_NATIVE=true
   VITE_PURE_JS=true
   VITE_FORCE_ESM=true
   ```
5. **Module Compatibility**: If you have ES module issues, make sure to use the right file extensions:
   - `.cjs` for CommonJS modules
   - `.mjs` for ES modules
   - Check your package.json "type" field

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [Rollup Documentation](https://rollupjs.org/)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [Render.com Deployment Guide](https://render.com/docs/deploy-node-express-app)
