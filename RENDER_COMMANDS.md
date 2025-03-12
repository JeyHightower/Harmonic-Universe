# Render.com Deployment Commands

## Build Command

```bash
chmod +x render-deploy.sh && ./render-deploy.sh
```

## Start Command

```bash
cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Required Environment Variables

```
NODE_VERSION=18.17.0
PYTHON_VERSION=3.9.6
FLASK_ENV=production
FLASK_APP=app
PYTHONPATH=/opt/render/project/src:/opt/render/project/src/backend
CI=false
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

## Note on ES Modules

The frontend uses ES modules (as specified by `"type": "module"` in package.json). All Node.js scripts must use ES module syntax (`import` instead of `require`).
