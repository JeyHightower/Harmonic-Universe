# Render.com Deployment Commands

## Recommended Build Command (NEW - Fixes Module Not Found Error)

```bash
chmod +x render-build-command.sh && ./render-build-command.sh
```

This new wrapper script:

- Handles the "Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'" error
- Uses a fixed version of Vite (4.5.1) instead of "latest"
- Includes multiple fallback methods if one approach fails
- Creates a maintenance page if all build methods fail

## Alternative Build Commands

```bash
chmod +x render-build-direct.sh && ./render-build-direct.sh
```

```bash
chmod +x render-deploy.sh && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production ./render-deploy.sh
```

## Start Command

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Direct npx Command (For Render's Build Command Field)

```bash
cd frontend && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production npx vite@4.5.1 build --mode production --emptyOutDir
```

> ⚠️ **IMPORTANT:**
>
> 1. Do NOT use the `--force` flag with Vite on Render.com. It results in the error: `CACError: Unknown option '--force'`
> 2. Always use a specific version number with Vite (e.g., vite@4.5.1) to avoid compatibility issues

## Required Environment Variables

```
NODE_VERSION=18.17.0
PYTHON_VERSION=3.9.6
FLASK_ENV=production
FLASK_APP=app
PYTHONPATH=/opt/render/project/src:/opt/render/project/src/backend
CI=false
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true
NODE_OPTIONS=--no-experimental-fetch
NPM_CONFIG_OPTIONAL=false
NODE_ENV=production
SECRET_KEY=[Generate a secure random string]
```

## Database Environment Variable (if using PostgreSQL)

```
DATABASE_URL=[Database connection string provided by Render]
```

## Custom Environment Variables

```
REACT_APP_BASE_URL=[Your application URL, e.g., https://harmonic-universe.onrender.com]
```

## Troubleshooting Tips

### Common Errors and Solutions

1. **Error: `Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'`**

   - Solution: Use our new `render-build-command.sh` script which ensures Vite is properly installed before using it
   - Or explicitly install Vite with a specific version: `npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional`
   - Always check if the file exists before trying to use it directly: `if [ -f "./node_modules/vite/bin/vite.js" ]`

2. **Error: `CACError: Unknown option '--force'`**

   - Solution: Remove the `--force` flag from any Vite command when deploying on Render
   - Update the `render-build` script in package.json to remove this flag

3. **If you encounter other Rollup/Vite build issues:**

   - Use the `render-build-command.sh` script which includes multiple fallback build methods
   - If all else fails, a maintenance page will be displayed so the backend can still run

4. **If you encounter "Failed to find attribute 'app' in 'wsgi'" error:**
   - The wsgi.py file has been updated to include `app = application`
   - Alternatively, use: `cd backend && gunicorn --workers=2 --timeout=120 --log-level info simple_app:app`

## Two-Step Deployment (If All Else Fails)

If your build still fails despite all these precautions, you can deploy in steps:

1. First deploy only the backend:

   ```bash
   cd backend && python -m pip install --upgrade pip && python -m pip install -r requirements.txt && python -m pip install gunicorn
   ```

2. After the backend is running, build the frontend locally and upload to a separate static site service (e.g., Netlify, Vercel)

## Using render.yaml for Blueprint Deployments

We've provided a `render.yaml` file that you can use with Render's Blueprint feature:

```yaml
services:
  - type: web
    name: harmonic-universe
    runtime: python
    region: ohio
    buildCommand: chmod +x render-build-command.sh && ./render-build-command.sh
    startCommand: cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
    # Environment variables are set in the file
```

## Note on ES Modules

The frontend uses ES modules (as specified by `"type": "module"` in package.json). All Node.js scripts use ES module syntax (`import` instead of `require`).
