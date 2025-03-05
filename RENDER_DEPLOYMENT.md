# Harmonic Universe Deployment Guide

This guide explains how to deploy the Harmonic Universe application on Render.com.

## What We Fixed

We fixed several issues that were preventing the application from deploying correctly:

1. **Import Paths**: Updated all imports in the backend code to use the proper `backend.app` path structure
   instead of just `app`, which was causing import errors.

2. **Entry Point Structure**: Created proper entry points at the root level:

   - `app.py`: The main entry point that imports and instantiates the application
   - `wsgi.py`: A WSGI-compatible entry point for Gunicorn

3. **Python Path Configuration**: Ensured PYTHONPATH includes the current directory in
   both Render.yaml configuration and start commands.

4. **Verification Script**: Enhanced the verification script to provide detailed diagnostic information.

## Deployment on Render.com

### Option 1: Using the render.yaml file

1. Make sure the `render.yaml` file is in the root of your repository
2. Connect your repository to Render.com
3. Render.com will automatically detect and use the configuration in render.yaml

### Option 2: Manual Configuration in Render Dashboard

1. Create a new Web Service in the Render.com dashboard
2. Connect your repository
3. Configure the following settings:

   **Build Command:**

   ```
   pip install -r backend/requirements.txt && pip install gunicorn && cd frontend && npm install && npm run render-build && cd .. && mkdir -p static && cp -r frontend/dist/* static/ && cp frontend/public/react-polyfill.js static/ 2>/dev/null || true && cp frontend/public/react-context-provider.js static/ 2>/dev/null || true
   ```

   **Start Command:**

   ```
   PYTHONPATH=. gunicorn app:create_app()
   ```

   **Environment Variables:**

   - PYTHONPATH: `.`
   - FLASK_APP: `app`
   - FLASK_ENV: `production`
   - REACT_APP_BASE_URL: `https://harmonic-universe.onrender.com` (adjust as needed)

## Verification

Before deploying, run the verification script locally to ensure everything works:

```bash
python verify_render_setup.py
```

All checks should pass before deploying.

## Troubleshooting

If you encounter issues:

1. Check the Render.com logs for error messages
2. Verify that all the environment variables are set correctly
3. Make sure your database connection string is properly configured
4. Run the verification script locally to diagnose issues

## Directory Structure

```
harmonic-universe/
├── app.py                 # Main entry point that imports from backend
├── wsgi.py                # WSGI entry point for Gunicorn
├── render.yaml            # Render.com configuration
├── verify_render_setup.py # Verification script
├── backend/               # Backend Flask application
│   └── app/               # Main application package
├── frontend/              # Frontend React application
└── static/                # Built frontend files (created during build)
```

## Prerequisites

- A GitHub account with your Harmonic Universe repository
- A Render.com account (free tier is sufficient to start)
- Basic understanding of environment variables and databases

## Deployment Tools

This repository includes several scripts to help with the deployment process:

- `render_deploy.sh`: Prepares your application for deployment to Render
- `render_db_manager.sh`: Helps manage the lifecycle of your Render database instance

## Deployment Steps

### 1. Prepare Your Application

Run the deployment preparation script:

```bash
./render_deploy.sh
```

This script will:

- Check for required dependencies
- Verify the Flask app configuration for serving the React frontend
- Update the React build script if needed
- Create a `render.yaml` configuration file
- Create a deployment reference file
- Check for debug statements that should be removed

Follow the prompts and make any necessary changes to your codebase.

### 2. Set Up Your Render Account

1. Sign up for an account at [Render.com](https://render.com)
2. Connect your GitHub account to Render by following the prompts

### 3. Create a Postgres Database Instance

1. Log in to your Render dashboard
2. Click on "New +" and select "PostgreSQL"
3. Configure your database:
   - Name: `harmonic-universe-db` (or any descriptive name)
   - Region: Choose the closest region to your users
   - Database: Leave as default
   - User: Leave as default
4. Click "Create Database"

After creation, note the "Internal Database URL" for later use.

### 4. Create a Web Service for Your Application

1. From your Render dashboard, click "New +" and select "Web Service"
2. Select your GitHub repository
3. Configure the service:

   - Name: `harmonic-universe` (or any preferred name)
   - Environment: Python
   - Region: Same as your database
   - Branch: `main` (or your production branch)
   - Build Command:
     ```
     # Build frontend
     cd frontend && npm install && npm run build && cd ..
     # Build backend
     pip install -r backend/requirements.txt
     pip install psycopg2
     flask db upgrade
     flask seed all
     ```
   - Start Command: `cd backend && gunicorn app.main:app`

4. Add Environment Variables:

   - `FLASK_ENV`: `production`
   - `FLASK_APP`: `backend/app`
   - `SECRET_KEY`: (click "Generate" for a secure random key)
   - `SCHEMA`: `harmonic_universe_schema` (or your preferred schema name)
   - `REACT_APP_BASE_URL`: (your Render application URL, e.g., `https://harmonic-universe.onrender.com`)
   - `DATABASE_URL`: (paste the Internal Database URL from step 3)

5. Set Auto-Deploy to "Yes"

6. Click "Create Web Service"

Your application will begin deploying. This process may take 10-15 minutes for the initial deployment.

### 5. Monitor Your Deployment

1. Watch the deployment logs in the Render dashboard
2. Check for any errors in the build or start process
3. Once deployed, test your application by visiting the URL provided

### 6. Set Up Database Expiry Reminders

Free tier Render PostgreSQL databases are deleted after 90 days. To avoid downtime, set up reminders:

```bash
# Track when your database was created
echo "$(date +"%Y-%m-%d")" > .render_db_created

# Set up a calendar reminder
./render_db_manager.sh setup-reminder
```

Import the generated ICS file to your calendar application.

## Maintaining Your Deployment

### Checking Database Expiry

Run this command to check when your database will expire:

```bash
./render_db_manager.sh check-expiry
```

### Creating a New Database Instance

When your database is nearing expiry (around day 85), follow these steps:

```bash
# Get instructions
./render_db_manager.sh instructions
```

Follow the displayed instructions to create a new database instance and update your application.

### Backing Up Your Database

Before replacing your database, create a backup:

```bash
export DATABASE_URL="your-database-url"
./render_db_manager.sh backup
```

## Troubleshooting

### Application Crashes

If your application crashes, check the logs in the Render dashboard:

1. Navigate to your web service
2. Click on "Logs" in the left sidebar
3. Look for error messages

Common issues include:

- Missing environment variables
- Database connection problems
- Module import errors

### Database Connection Issues

If you're experiencing database connection issues:

1. Verify the `DATABASE_URL` is correct
2. Check if the database is active
3. Ensure your schema name matches the `SCHEMA` environment variable

### Frontend Not Loading

If the frontend is not loading:

1. Check the Flask configuration to ensure it's serving the React frontend
2. Verify the build process completed successfully
3. Check for CORS issues in the browser console

## More Information

For more detailed information about deploying to Render, refer to these resources:

- [Render Python Documentation](https://render.com/docs/deploy-python)
- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [Flask on Render Guide](https://render.com/docs/deploy-flask)

## Need Help?

If you encounter any issues with deployment, please:

1. Check the Render documentation
2. Review the application logs in the Render dashboard
3. Consult the Flask and React documentation for specific framework issues
