# Deployment Guide

This guide provides instructions for deploying the Harmonic Universe application on Render.com.

## Prerequisites

- A Render.com account
- A PostgreSQL database (can be created on Render.com)
- The project code in a Git repository

## Environment Variables

The following environment variables need to be set in the Render.com dashboard:

- `DJANGO_SECRET_KEY`: A secret key for the Django application
- `DATABASE_URL`: The URL for the PostgreSQL database
- `DJANGO_SETTINGS_MODULE`: The settings module to use (e.g., `backend.settings.production`)
- `WEB_CONCURRENCY`: The number of workers to use (recommended: 4)
- `PYTHON_VERSION`: The Python version to use (e.g., `3.9.16`)
- `NODE_VERSION`: The Node.js version to use (e.g., `16.20.0`)

## Deployment Steps

1. **Fork or clone the repository**

   Fork the repository on GitHub or clone it to your local machine.

2. **Create a new Web Service on Render**

   - Go to the Render.com dashboard
   - Click "New" > "Web Service"
   - Connect your GitHub repository
   - Set the name to "harmonic-universe"
   - Set the build command to `./scripts/build.sh`
   - Set the start command to `cd backend && gunicorn app:app`
   - Add the environment variables listed above

3. **Configure environment variables**

   In the web service settings, add the environment variables listed above.

4. **Set up the PostgreSQL database**

   - Go to the Render.com dashboard
   - Click "New" > "PostgreSQL"
   - Set the name to "harmonic-universe-db"
   - After creation, copy the Internal Database URL
   - Add it as the `DATABASE_URL` environment variable in your web service

5. **Deploy the application**

   - Click "Manual Deploy" > "Deploy latest commit"
   - Monitor the logs for any issues

## Troubleshooting

- **Database connection issues**: Ensure the `DATABASE_URL` environment variable is correctly set.
- **Static files not loading**: Check the `STATIC_URL` and `STATIC_ROOT` settings in your Django configuration.
- **Application errors**: Check the logs in the Render.com dashboard for error messages.
