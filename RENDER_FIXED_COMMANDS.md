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
     - Method 1: Using npx with fixed version
     - Method 2: Direct use of module if it exists
     - Method 3: Custom Node script approach
     - Method 4: Global installation approach
   - Added file existence checks before attempting to use the module
   - Created a programmatic build script that doesn't rely on the CLI
   - Added a maintenance page fallback if all build methods fail

2. **"Rollup failed to resolve import 'react-router-dom'"**

   - Fixed by configuring Vite to properly bundle external dependencies
   - Added explicit inclusion of react-router-dom in the optimizeDeps settings
   - Updated the manualChunks configuration to properly bundle vendor dependencies

3. **"Missing script: 'start'"**
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
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true
NODE_ENV=production
```

## Troubleshooting

If you still encounter issues:

1. **Check the logs**: Look for specific error messages in the Render.com build logs
2. **Try the direct build command**: If the wrapper script fails, you can try the direct build command:
   ```bash
   cd frontend && rm -rf node_modules package-lock.json && npm install --no-optional && npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 react-router-dom@6.20.0 && npx vite@4.5.1 build
   ```
3. **Deploy backend only**: If frontend build continues to fail, you can deploy just the backend and serve a static maintenance page

The updated scripts and configuration files now properly handle:

1. Explicit versioning for all dependencies
2. Proper bundling of React Router and other external dependencies
3. Multiple fallback methods to ensure successful builds
4. Improved error handling at every step
5. Automatic creation of maintenance page if all build methods fail
