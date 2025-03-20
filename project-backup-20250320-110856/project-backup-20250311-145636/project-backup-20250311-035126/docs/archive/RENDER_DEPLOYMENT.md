# Harmonic Universe Deployment on Render.com

This document outlines the deployment setup for Harmonic Universe on Render.com.

## Deployment Architecture

The Harmonic Universe application is deployed as a Web Service on Render.com using the following architecture:

1. **Python Flask Backend**

   - Python 3.9 runtime
   - Gunicorn as the WSGI server
   - Flask web framework

2. **Static Asset Handling**
   - Static files served from `/static` directory
   - React frontend built files served via Flask

## Configuration Files

### 1. `render.yaml`

The main configuration file that defines how Render.com deploys the application:

```yaml
services:
  - type: web
    name: harmonic-universe
    runtime: python
    buildCommand: pip install gunicorn flask flask-cors && pip install -r requirements.txt
    startCommand: bash ./render_start.sh
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.18
      - key: NODE_VERSION
        value: 18.18.0
```

### 2. `render_start.sh`

A bash script that runs at application startup to:

- Create necessary static directories
- Run the setup script
- Start Gunicorn with the proper configuration

### 3. `render_wsgi.py`

The WSGI entry point for the application that:

- Imports the Flask app using the create_app factory pattern
- Adds middleware for ensuring proper Content-Length headers
- Includes a test route for deployment verification

### 4. `setup_render.py`

Python script that runs at startup to:

- Create all necessary static directories
- Generate default index.html files if needed
- Set required environment variables

### 5. `gunicorn.conf.py`

Configuration file for Gunicorn that:

- Sets worker and timeout settings
- Ensures static directories exist
- Configures logging

## Static File Handling

The application handles static files in multiple locations for redundancy:

1. `/opt/render/project/src/static/` - The primary Render.com static directory
2. `app/static/` - The Flask app's static directory
3. `static/` - Local static directory

All three directories are created and populated with at least an `index.html` file at startup.

## Deployment Process

When Render.com deploys the application:

1. The build command installs necessary dependencies
2. The start command runs `render_start.sh` which:
   - Creates necessary directories
   - Runs `setup_render.py` to ensure static files exist
   - Starts Gunicorn with `app.wsgi:application` as the entry point

## Troubleshooting

If you encounter issues with static file serving:

1. Check the logs for errors in the setup scripts
2. Verify the static directories exist and contain the required files
3. Check permissions on the static directories and files
4. Test the `/render-test` endpoint to verify the WSGI setup

## Updating the Deployment

To update the deployment configuration:

1. Modify the appropriate configuration file(s)
2. Commit and push changes to the repository
3. Trigger a new deployment on Render.com

## Environment Variables

The application uses the following environment variables:

- `RENDER` - Set to 'true' on Render.com
- `STATIC_FOLDER` - Path to the static files directory
- `PORT` - Port for the application to listen on

## What We Fixed

This deployment configuration addresses several common issues:

### 1. AttributeError: 'Flask' object has no attribute 'wsgi'

This error occurred because Gunicorn was trying to access a non-existent method on the Flask application object. We fixed this by:

- Creating a proper WSGI entry point in `app/wsgi.py`
- Ensuring the Flask app is exposed correctly as `app`
- Using a direct startup command that avoids confusion with app loading

### 2. AttributeError: module 'app.wsgi' has no attribute 'application'

This error occurred because Gunicorn expects an attribute named 'application' in the WSGI module. We fixed this by:

- Adding the line `application = app` in app/wsgi.py to create the alias Gunicorn expects
- Updating render_start.sh to explicitly use `app.wsgi:application` in the Gunicorn command

### 3. Static File Serving Issues

Problems with static files not being found or served were addressed by:

- Creating static directories in multiple locations for redundancy
- Adding a default `index.html` file at startup
- Setting explicit static folder paths in the Flask app
- Adding middleware to ensure Content-Length headers are set correctly

### 4. Startup Sequencing

Issues with the application not starting correctly were fixed by:

- Creating a dedicated `render_start.sh` script that handles startup in the correct order
- Running setup scripts before starting Gunicorn
- Simplifying the Gunicorn configuration
- Adding thorough logging throughout the startup process

### 5. Node.js Version Warning

Updated the Node.js version to 18.18.0 to address the end-of-life warning for Node.js 16.13.0.

## Next Steps

1. Monitor the application logs after deployment to ensure everything is working correctly
2. Consider implementing a health check endpoint that verifies database connectivity
3. Update the Static Asset handling to support a full React frontend build process

## Deployment on Render.com

### Option 1: Using the render.yaml file (Recommended)

1. Make sure the `render.yaml` file is in the root of your repository
2. Connect your repository to Render.com
3. Render.com will automatically detect and use the configuration in render.yaml

The current render.yaml file is configured to:

- Install required dependencies
- Build the React frontend
- Copy the frontend build files to the appropriate static directory
- Start the application using the render_start.sh script

### Option 2: Manual Configuration in Render Dashboard

1. Create a new Web Service in the Render.com dashboard
2. Connect your repository
3. Configure the following settings:

   **Build Command:**

   ```
   pip install gunicorn==21.2.0 flask-migrate flask-cors && pip install -r requirements.txt && cd frontend && npm ci && npm run build && mkdir -p ../static && cp -r build/* ../static/
   ```

   **Start Command:**

   ```
   bash ./render_start.sh
   ```

   **Environment Variables:**

   - PYTHON_VERSION: `3.9.18`
   - NODE_VERSION: `18.18.0`
   - PORT: `8000`
   - STATIC_DIR: `/opt/render/project/src/static`
   - FLASK_APP: `app`
   - RENDER: `true`
   - APP_ENV: `production`
   - LOG_LEVEL: `INFO`

## Key Files for Deployment

### 1. `render.yaml`

Defines the service configuration for Render.com.

### 2. `render_start.sh`

A bash script that sets up the environment and starts the application.

### 3. `setup_render.py`

A Python script that ensures static directories exist and contain required files.

### 4. `app/wsgi.py`

The WSGI entry point that creates and configures the Flask application.

### 5. `app/__init__.py`

Contains the `create_app()` factory function that initializes the Flask application.

## Testing the Deployment Locally

To test this configuration locally:

```bash
# Run the setup script
python setup_render.py

# Start the application
python -m app.wsgi
```

You can also test with Gunicorn directly:

```bash
# Start with Gunicorn
gunicorn app.wsgi:application --bind=0.0.0.0:8000
```

## Important WSGI Configuration Details

In our app/wsgi.py file, we've defined both `app` and `application` variables. This is because:

1. `app` is the conventional name for Flask applications in code
2. `application` is what WSGI servers like Gunicorn expect by default

The line `application = app` creates an alias that ensures Gunicorn can properly import the Flask application. Without this alias, you would get the error:

```
AttributeError: module 'app.wsgi' has no attribute 'application'
```

## Verifying Static File Handling

To verify that static files are being handled correctly:

1. Check that the static directories exist:

   - `/opt/render/project/src/static/` (on Render.com)
   - `app/static/`
   - `static/`

2. Visit the home route to see if the index.html file is loaded correctly

3. Visit `/render-test` to see details about the application configuration

## Directory Structure

```
harmonic-universe/
├── app/                   # Main application package
│   ├── __init__.py        # Contains create_app() factory
│   ├── wsgi.py            # WSGI entry point for Gunicorn
│   └── static/            # App-specific static files
├── static/                # Main static directory (for frontend build)
├── render.yaml            # Render.com configuration
├── render_start.sh        # Startup script for Render
├── setup_render.py        # Setup script for static directories
└── frontend/              # Frontend React application
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
