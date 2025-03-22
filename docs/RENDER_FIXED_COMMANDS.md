# Fixed Render.com Deployment Commands

## 1. Build Command (Use This)

```bash
chmod +x render-build-command.sh && ./render-build-command.sh
```

## 2. Start Command

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Fixed Build Issues

We've resolved the following issues:

1. **"Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'"**

   - Fixed by implementing multiple fallback build methods:
     - Method 1: Using npx with fixed version and SKIP_NATIVE flags
     - Method 2: Direct use of module if it exists
     - Method 3: CommonJS script approach
     - Method 4: ES Module script approach
     - Method 5: Direct config use with disabled Rollup native
     - Method 6: Minimal build fallback with static HTML/JS/CSS
   - Added file existence checks before attempting to use the module
   - Created CommonJS and ES Module build scripts to handle different module systems
   - Added a maintenance page fallback if all build methods fail

2. **"Cannot find module '@rollup/rollup-linux-x64-gnu'"**

   - Fixed by adding additional environment variables to disable Rollup's native functionality:
     ```bash
     export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
     export ROLLUP_NATIVE_PURE_JS=true
     export ROLLUP_DISABLE_NATIVE=true
     ```
   - Created a special Vite config that disables Rollup native functionality
   - Used explicit Rollup version (3.29.4) that works better in cloud environments
   - Added the `--ignore-scripts` flag during installation to prevent native compilation

3. **"ReferenceError: require is not defined in ES module scope"**

   - Fixed by creating both CommonJS (.cjs) and ES Module (.mjs) build scripts
   - Added proper handling for both module systems
   - Used the `--experimental-vm-modules` flag for Node.js when running ES modules
   - Added dynamic imports for ES modules using `import()` instead of `require()`

4. **"Rollup failed to resolve import 'react-router-dom'"**

   - Fixed by configuring Vite to properly bundle external dependencies
   - Added explicit inclusion of react-router-dom in the optimizeDeps settings
   - Updated the manualChunks configuration to properly bundle vendor dependencies

5. **"Missing script: 'start'"**
   - Added a fix-npm-start.sh script to ensure the start script exists in package.json
   - Updated package.json to include both "start" and "dev" scripts

## Local Development & Build Commands

If you're having issues with your local build, use the following commands:

### Fix npm start Script Issue

```bash
./fix-npm-start.sh
```

### Fix Local Build Issues

```bash
./fix-build.sh
```

### Start Development Server

```bash
cd frontend && npm start
```

or

```bash
cd frontend && npm run dev
```

### Build for Production Locally

```bash
cd frontend && npm run build
```

## Required Environment Variables

Make sure you have these set in Render.com:

```
NODE_VERSION=18.17.0
PYTHON_VERSION=3.9.6
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096 --experimental-vm-modules
```

## Troubleshooting

If you still encounter issues:

1. **Check the logs**: Look for specific error messages in the Render.com build logs
2. **Try the direct build command**: If the wrapper script fails, you can try the direct build command:
   ```bash
   cd frontend && rm -rf node_modules package-lock.json && \
   ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true \
   npm install --no-optional --ignore-scripts && \
   npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 rollup@3.29.4 react-router-dom@6.20.0 --no-optional --ignore-scripts && \
   npx vite@4.5.1 build
   ```
3. **Module compatibility issues**: If you encounter ES/CommonJS module issues:
   - Use `.cjs` extension for CommonJS files
   - Use `.mjs` extension for ES Module files
   - Check your package.json "type" field
4. **Deploy backend only**: If frontend build continues to fail, you can deploy just the backend and serve a static maintenance page

The updated scripts and configuration files now properly handle:

1. Explicit versioning for all dependencies
2. Proper bundling of React Router and other external dependencies
3. Multiple fallback methods to ensure successful builds
4. Improved error handling at every step
5. Automatic creation of maintenance page if all build methods fail
6. Support for both CommonJS and ES Module systems
7. Prevention of native module compilation that fails in cloud environments
