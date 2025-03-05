# Harmonic Universe Deployment Guide

This guide provides step-by-step instructions for deploying the Harmonic Universe application to Render.com.

## Prerequisites

- A GitHub account with your Harmonic Universe repository
- A Render.com account (free tier is sufficient to start)
- Basic understanding of environment variables and databases

## Deployment Files

The following files are essential for deployment:

1. **build.sh**: The build script that prepares your application for deployment
2. **render.yaml**: Configuration file for Render.com services
3. **app.py**: The main entry point for the Flask application
4. **wsgi.py**: WSGI entry point for Gunicorn
5. **verify_deployment.sh**: Script to verify your deployment setup locally

## Deployment Steps

### 1. Verify Your Deployment Setup

Run the verification script to ensure your application is ready for deployment:

```bash
./verify_deployment.sh
```

All checks should pass before proceeding.

### 2. Push Your Code to GitHub

Ensure all your changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render.com deployment"
git push
```

### 3. Set Up Your Render Account

1. Sign up for an account at [Render.com](https://render.com)
2. Connect your GitHub account to Render by following the prompts

### 4. Deploy Using render.yaml (Recommended)

1. In your Render dashboard, click on "New" and select "Blueprint"
2. Connect to your GitHub repository
3. Render will automatically detect the `render.yaml` file and configure your services
4. Review the configuration and click "Apply"
5. Render will create the database and web service as specified in your `render.yaml` file

### 5. Manual Deployment (Alternative)

If you prefer to set up your services manually:

#### Create a PostgreSQL Database

1. In your Render dashboard, click on "New" and select "PostgreSQL"
2. Configure your database:
   - Name: `harmonic-universe-db` (or any descriptive name)
   - Database: Leave as default
   - User: Leave as default
   - Region: Choose the closest region to your users
3. Click "Create Database"
4. Note the "Internal Database URL" for the next step

#### Create a Web Service

1. In your Render dashboard, click on "New" and select "Web Service"
2. Connect to your GitHub repository
3. Configure the service:
   - Name: `harmonic-universe` (or any preferred name)
   - Environment: Python
   - Region: Same as your database
   - Branch: `main` (or your production branch)
   - Build Command: `./build.sh`
   - Start Command: `gunicorn wsgi:app --log-level debug`
4. Add Environment Variables:
   - `FLASK_ENV`: `production`
   - `FLASK_APP`: `app.py`
   - `FLASK_DEBUG`: `0`
   - `PYTHONPATH`: `.`
   - `PYTHONUNBUFFERED`: `1`
   - `STATIC_DIR`: `static`
   - `VITE_API_URL`: Your Render application URL (e.g., `https://harmonic-universe.onrender.com`)
   - `REACT_APP_BASE_URL`: Same as `VITE_API_URL`
   - `GENERATE_SOURCEMAP`: `false`
   - `NODE_OPTIONS`: `--max-old-space-size=3072`
   - `RENDER`: `true`
   - `DISABLE_ESLINT_PLUGIN`: `true`
   - `SECRET_KEY`: Generate a secure random key
   - `DATABASE_URL`: Paste the Internal Database URL from the previous step
5. Click "Create Web Service"

### 6. Monitor Your Deployment

1. Watch the deployment logs in the Render dashboard
2. Check for any errors in the build or start process
3. Once deployed, test your application by visiting the URL provided

## Troubleshooting

### Common Issues

#### Build Failures

- **Issue**: Frontend build fails

  - **Solution**: Check the build logs for specific errors. Common issues include Node.js version compatibility or memory limitations.
  - **Fix**: Try updating the Node.js version in `render.yaml` or increasing the memory allocation in `NODE_OPTIONS`.

- **Issue**: Python dependency installation fails
  - **Solution**: Check the requirements.txt file for incompatible dependencies.
  - **Fix**: Update the problematic dependencies or specify compatible versions.

#### Runtime Errors

- **Issue**: Application crashes after deployment

  - **Solution**: Check the logs in the Render dashboard for error messages.
  - **Fix**: Address the specific errors shown in the logs.

- **Issue**: Database connection errors

  - **Solution**: Verify the `DATABASE_URL` environment variable is correctly set.
  - **Fix**: Update the environment variable with the correct connection string.

- **Issue**: Static files not being served
  - **Solution**: Check if the static files were correctly built and copied to the static directory.
  - **Fix**: Verify the build.sh script is correctly copying files to the static directory.

### Debugging Tips

1. Enable debug logging by setting `--log-level debug` in the start command
2. Check the application logs in the Render dashboard
3. Test your application locally before deploying
4. Verify environment variables are correctly set

## Maintenance

### Database Management

Free tier Render PostgreSQL databases have limitations. To avoid issues:

1. Monitor your database usage
2. Set up regular backups
3. Be aware of the free tier limitations

### Updating Your Application

To update your deployed application:

1. Make changes to your code
2. Commit and push to GitHub
3. Render will automatically redeploy your application if auto-deploy is enabled

## Additional Resources

- [Render Python Documentation](https://render.com/docs/deploy-python)
- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [Flask on Render Guide](https://render.com/docs/deploy-flask)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## Need Help?

If you encounter any issues with deployment, please:

1. Check the Render documentation
2. Review the application logs in the Render dashboard
3. Consult the Flask and React documentation for specific framework issues
