# Deploying Harmonic Universe to Render.com

This guide provides instructions for deploying the Harmonic Universe application to Render.com.

## Prerequisites

Before you begin, ensure you have:

- A [Render.com](https://render.com) account
- Access to the Harmonic Universe repository
- [Git](https://git-scm.com/downloads) installed on your machine

## Deployment Options

There are two main methods to deploy this application:

1. **Blueprint Deployment** - Using the `render.yaml` configuration file
2. **Manual Deployment** - Setting up services individually through the Render dashboard

## Option 1: Blueprint Deployment (Recommended)

Render's Blueprint feature allows you to deploy the entire stack with a single click.

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
   - Build Command: `./render-build.sh`
   - Start Command: `./render-start.sh`
4. Add the following environment variables:
   - `NODE_VERSION`: 16.x (or your preferred Node.js version)
   - `PYTHON_VERSION`: 3.11.0 (or your preferred Python version)
   - `FLASK_ENV`: production
   - `FLASK_APP`: app.py
   - `SECRET_KEY`: [Generate a secure random string]
   - `JWT_SECRET_KEY`: [Generate a secure random string]
   - `DATABASE_URL`: [Use the connection URL from your database setup]
   - `VITE_API_BASE_URL`: Your application URL (e.g., https://harmonic-universe.onrender.com)
5. Click "Create Web Service"

## Understanding the Deployment Scripts

The repository contains two key scripts for deployment:

### render-build.sh

This script handles the build process:

- Installs frontend dependencies and builds the React application
- Sets up the backend environment and installs dependencies
- Runs database migrations
- Copies the frontend build to the backend static directory

### render-start.sh

This script starts the application in production:

- Activates the virtual environment
- Ensures any pending migrations are applied
- Starts the application with Gunicorn, a production-ready WSGI server

## Environment Variables

The following environment variables are required for a successful deployment:

| Variable            | Description                   | Example                                       |
| ------------------- | ----------------------------- | --------------------------------------------- |
| `NODE_VERSION`      | Version of Node.js            | 16.x                                          |
| `PYTHON_VERSION`    | Version of Python             | 3.11.0                                        |
| `FLASK_ENV`         | Flask environment             | production                                    |
| `FLASK_APP`         | Flask application entry point | app.py                                        |
| `SECRET_KEY`        | Secret key for Flask          | [random string]                               |
| `JWT_SECRET_KEY`    | Key for JWT token generation  | [random string]                               |
| `DATABASE_URL`      | Database connection string    | postgresql://user:password@host:port/database |
| `VITE_API_BASE_URL` | API URL for frontend          | https://your-app.onrender.com                 |

## Monitoring and Troubleshooting

After deployment, you can monitor your application in the Render dashboard:

1. View application logs in real-time
2. Check CPU and memory usage
3. See recent deploys and their status

### Common Issues:

1. **Build Failures**:

   - Check the build logs for errors
   - Ensure all dependencies are correctly specified
   - Verify that the render-build.sh script has execute permissions (`git update-index --chmod=+x render-build.sh`)

2. **Database Connection Issues**:

   - Verify that the `DATABASE_URL` is correctly formatted
   - Check that the database server is accessible from the web service
   - Ensure all required database extensions are enabled

3. **Frontend Not Loading**:
   - Check that the frontend build was successful
   - Verify that `VITE_API_BASE_URL` is set correctly
   - Inspect the browser console for any JavaScript errors

## Database Migrations

Database migrations are run automatically during the build process. If you need to run migrations manually:

1. SSH into your Render instance (if available)
2. Navigate to the backend directory
3. Run: `python -m flask db upgrade`

## Continuous Deployment

Render automatically deploys when changes are pushed to your repository's main branch. You can configure this behavior in the service settings to:

1. Enable auto-deploy for specific branches
2. Disable auto-deploy and manually trigger deploys
3. Set up pull request previews

## Scaling Your Application

As your application grows, you may need to scale it:

1. Upgrade to a higher tier plan for more resources
2. Configure auto-scaling if available
3. Set up a Redis cache to improve performance

## Support and Resources

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com/)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [React Deployment Best Practices](https://vitejs.dev/guide/build.html)

For project-specific support, please contact the Harmonic Universe development team.
