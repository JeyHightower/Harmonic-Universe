# Harmonic Universe Deployment Guide for Render.com

This guide explains how to deploy your Harmonic Universe application to Render.com using the fixed configuration.

## Prerequisites

- A GitHub repository with your application code
- A Render.com account
- The fixed scripts in your repository:
  - `build.sh`
  - `start.sh`
  - `application.py`
  - `render.yaml`

## Deployment Steps

### 1. Commit and Push Your Changes

First, make sure all the fixed scripts are committed to your repository:

```bash
git add build.sh start.sh application.py render.yaml
git commit -m "Fix Gunicorn application import and configure for Render.com deployment"
git push
```

### 2. Connect to Render.com

1. Log in to your Render.com account
2. Click on "New" and select "Blueprint" from the dropdown menu
3. Connect your GitHub repository
4. Render will automatically detect your `render.yaml` file

### 3. Configure Your Service

Render will use the configuration in your `render.yaml` file:

```yaml
services:
  - type: web
    name: harmonic-universe
    runtime: python
    buildCommand: ./build.sh
    startCommand: ./start.sh
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.6
      - key: NODE_OPTIONS
        value: --max-old-space-size=4096
      - key: VITE_APP_DEBUG
        value: 'true'
      - key: FLASK_ENV
        value: production
```

This configuration tells Render to:

- Use Python as the runtime
- Run `./build.sh` to build your application
- Run `./start.sh` to start your application
- Set environment variables for Python version, Node memory, and Flask environment

### 4. Deploy Your Application

Click "Apply" to start the deployment process. Render will:

1. Clone your repository
2. Run your `build.sh` script to:
   - Install Python dependencies
   - Install frontend dependencies
   - Build the frontend application
   - Copy the build files to the static directory
3. Run your `start.sh` script to:
   - Start your Flask application with Gunicorn
   - Use the compatibility layer in `application.py`

### 5. Monitor the Deployment

You can monitor the deployment process in the Render dashboard. If there are any issues, you can check the logs to troubleshoot.

## How the Fixed Configuration Works

### The Compatibility Layer

The `application.py` file serves as a compatibility layer between Gunicorn and your Flask application:

```python
"""
Compatibility module for Gunicorn WSGI server.
This imports from app.py and ensures either 'app' or 'application' is available.
"""
try:
    # First try importing app
    from app import app

    # If the variable is already named 'application', we're done
    if "app" == "application":
        # application is already defined correctly
        pass
    else:
        # Otherwise, create an alias
        application = app

except ImportError as e:
    # If direct import fails, try importing the create_app function
    try:
        from app import create_app
        application = create_app()
    except ImportError:
        # If all else fails, write error to a file and raise
        with open("gunicorn_import_error.log", "w") as f:
            f.write(f"Failed to import Flask app: {str(e)}")
        raise
```

This ensures that Gunicorn can find the `application` variable regardless of how your Flask app is defined in `app.py`.

### The Start Script

The `start.sh` script starts Gunicorn with the correct configuration:

```bash
#!/bin/bash
set -e

echo "===== STARTING FLASK APPLICATION FOR RENDER.COM ====="
echo "Date: $(date)"

# Set up environment
export FLASK_ENV=production

# Get PORT from environment variable with fallback
PORT=${PORT:-5000}
echo "Starting server on port $PORT..."

# Export PYTHONPATH to include current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Using our compatibility layer
echo "Using application:application as the WSGI entry point"
exec gunicorn "application:application" \
  --bind "0.0.0.0:$PORT" \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --workers 2 \
  --timeout 60
```

This script:

- Sets the Flask environment to production
- Gets the PORT from the environment variable (Render sets this automatically)
- Exports the PYTHONPATH to include the current directory
- Starts Gunicorn with the correct WSGI application path

## Troubleshooting

If you encounter any issues during deployment, check the following:

1. **Build Errors**: Check the build logs in the Render dashboard for any errors during the build process.

2. **Start Errors**: Check the logs for any errors when starting the application.

3. **Application Errors**: If the application starts but doesn't work correctly, check the application logs for any runtime errors.

4. **Environment Variables**: Make sure all required environment variables are set in your `render.yaml` file.

5. **Database Configuration**: If your application uses a database, make sure the database connection string is set correctly.

## Conclusion

With the fixed configuration, your Harmonic Universe application should now deploy successfully to Render.com. The compatibility layer ensures that Gunicorn can find your Flask application regardless of how it's defined in your code.
