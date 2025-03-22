# Deploying Harmonic Universe to Render.com

This guide provides instructions for deploying the Harmonic Universe application to Render.com.

## Prerequisites

Before you begin, ensure you have:

- A [Render.com](https://render.com) account
- Access to the Harmonic Universe repository
- [Git](https://git-scm.com/downloads) installed on your machine

## Deployment Options

There are two main methods to deploy this application:

1. **Automatic Deployment** - Using the `render.yaml` configuration file
2. **Manual Deployment** - Setting up services individually through the Render dashboard

## Option 1: Automatic Deployment (Recommended)

Render's Blueprint feature allows you to deploy directly from the `render.yaml` configuration file.

### Steps:

1. Fork or clone the Harmonic Universe repository
2. Log in to your Render account
3. Go to the Dashboard and click on "New +"
4. Select "Blueprint" from the dropdown menu
5. Connect your repository
6. Render will detect the `render.yaml` file and display the resources it will create
7. Click "Apply" to begin the deployment process

The deployment will create:

- A web service for the application
- A PostgreSQL database if specified in the configuration

## Option 2: Manual Deployment

### Database Setup:

1. In your Render dashboard, click "New +" and select "PostgreSQL"
2. Configure your database:
   - Name: `harmonic-universe-db`
   - User: Leave as auto-generated
   - Database: `harmonic_universe`
   - Select the appropriate region and plan
3. Click "Create Database" and note the connection details

### Web Service Setup:

1. In your Render dashboard, click "New +" and select "Web Service"
2. Connect your repository
3. Configure your service:
   - Name: `harmonic-universe`
   - Runtime: `Python 3`
   - Build Command:
     ```bash
     ./render-deploy.sh
     ```
   - Start Command:
     ```bash
     cd backend && gunicorn --workers=2 --timeout=120 wsgi:app
     ```
4. Add the following environment variables:
   - `NODE_VERSION`: 18.17.0
   - `PYTHON_VERSION`: 3.9.6
   - `FLASK_ENV`: production
   - `FLASK_APP`: app
   - `SECRET_KEY`: [Generate a secure random string]
   - `DATABASE_URL`: [Use the connection URL from your database setup]
   - `PYTHONPATH`: /opt/render/project/src:/opt/render/project/src/backend
   - `REACT_APP_BASE_URL`: Your application URL (e.g., https://harmonic-universe.onrender.com)
5. Click "Create Web Service"

## Monitoring and Troubleshooting

After deployment, you can monitor your application in the Render dashboard.

### Common Issues:

1. **Build Failures**:

   - Check the build logs for errors
   - Ensure all dependencies are correctly specified in requirements.txt and package.json
   - Verify that the render-deploy.sh script has the correct permissions

2. **Runtime Errors**:

   - Check the application logs in the Render dashboard
   - Common issues include database connection problems or environment variable misconfigurations

3. **Frontend Not Loading**:
   - Verify that the build process completed successfully
   - Check that static files were properly copied to the static directory

## Environment Variables

The following environment variables are required:

- `NODE_VERSION`: Version of Node.js (e.g., 18.17.0)
- `PYTHON_VERSION`: Version of Python (e.g., 3.9.6)
- `FLASK_ENV`: The Flask environment (production)
- `FLASK_APP`: The Flask application entry point (app)
- `SECRET_KEY`: A secure random string for session encryption
- `DATABASE_URL`: PostgreSQL connection string
- `PYTHONPATH`: Path to find Python modules
- `REACT_APP_BASE_URL`: The URL of your deployed application

## Manual Deployment Commands

If you need to manually deploy components, you can use the following commands:

### Backend:

```bash
cd backend
python -m pip install -r requirements.txt
python -m pip install gunicorn
gunicorn --workers=2 --timeout=120 wsgi:app
```

### Frontend:

```bash
cd frontend
npm install
npm run build  # Note: The frontend uses ES modules, not CommonJS
```

### Important Note About Node.js Scripts

This project uses ES modules for Node.js scripts (package.json has `"type": "module"`). Any Node.js scripts should use ES module syntax:

```javascript
// Correct (ES modules):
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Incorrect (CommonJS):
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
```

If you need to use `__dirname` or `__filename` in ES modules, use this pattern:

```javascript
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## Continuous Deployment

Render automatically deploys when changes are pushed to your repository's main branch. You can configure this behavior in the service settings.

## Support

For support with deployment issues:

- Check the Render logs for detailed error messages
- Consult the [Render documentation](https://render.com/docs)
- Reach out to the Harmonic Universe development team
