# Render.com Quick Fix Guide

## Error: `CACError: Unknown option '--force'`

If you're seeing this error when deploying to Render.com:

```
==> Running build command 'ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production npx vite build --mode production --force --emptyOutDir'...
==> Using Node.js version 18.17.0 via environment variable NODE_VERSION
CACError: Unknown option `--force`
```

Follow these steps to fix it:

## Step 1: Remove the `--force` flag

Edit your `frontend/package.json` file and update the `render-build` script:

```json
"render-build": "ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production vite build --mode production --emptyOutDir"
```

## Step 2: Update the build command in Render.com

In your Render dashboard, go to:

- Your service > Settings > Build Command

Replace with one of these options:

### Option 1: Simplified Build Command

```bash
cd frontend && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production npx vite build --mode production --emptyOutDir && cd .. && mkdir -p static && cp -r frontend/dist/* static/ 2>/dev/null || echo "No dist files found" && cd backend && python -m pip install --upgrade pip && python -m pip install -r requirements.txt && python -m pip install gunicorn
```

### Option 2: Use our Direct Build Script (recommended)

```bash
chmod +x render-build-direct.sh && ./render-build-direct.sh
```

### Option 3: Use our Full Deploy Script

```bash
chmod +x render-deploy.sh && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production ./render-deploy.sh
```

## Step 3: Make sure your Start Command is correct

Verify your start command is:

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Additional Resources

- See the full `RENDER_COMMANDS.md` file for more detailed options
- If you continue to have issues, try the two-step deployment process outlined in the full documentation

## Important Environment Variables

Make sure you have these set in Render.com:

```
NODE_VERSION=18.17.0
PYTHON_VERSION=3.9.6
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
NODE_ENV=production
```
