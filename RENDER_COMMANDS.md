# Render.com Deployment Commands

## Build Command (Updated)

```bash
chmod +x render-deploy.sh && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production ./render-deploy.sh
```

## Start Command

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Alternative Build Command (Without Shell Script)

```bash
cd frontend && rm -rf node_modules package-lock.json && rm -rf dist .vite && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production npm install --no-optional --prefer-offline --no-fund --no-audit --ignore-scripts && npm install --no-save vite@latest @vitejs/plugin-react@latest --no-optional && NODE_ENV=production ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true node ./node_modules/vite/bin/vite.js build && cd .. && mkdir -p static && cp -r frontend/dist/* static/ 2>/dev/null || echo "No dist files found" && cd backend && python -m pip install --upgrade pip && python -m pip install -r requirements.txt && python -m pip install gunicorn
```

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

### If you encounter Rollup/Vite build issues:

- The script now includes 3 fallback build methods that should cover most issues
- If all else fails, a maintenance page will be displayed so the backend can still run
- Check the deployment logs for specific error messages
- Try manually triggering a new build after the first deployment completes

### If you encounter "Failed to find attribute 'app' in 'wsgi'" error:

- The wsgi.py file has been updated to include `app = application`
- Alternatively, use: `cd backend && gunicorn --workers=2 --timeout=120 --log-level info simple_app:app`

## If Build Fails Despite All Precautions

If your build still fails despite all these precautions, you can deploy in steps:

1. First deploy only the backend:

   ```bash
   cd backend && python -m pip install --upgrade pip && python -m pip install -r requirements.txt && python -m pip install gunicorn
   ```

2. After the backend is running, build the frontend locally and upload to a separate static site service (e.g., Netlify, Vercel)

## Note on ES Modules

The frontend uses ES modules (as specified by `"type": "module"` in package.json). All Node.js scripts use ES module syntax (`import` instead of `require`).
