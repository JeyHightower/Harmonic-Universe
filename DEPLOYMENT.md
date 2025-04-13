# Harmonic Universe Deployment Guide

This document outlines the process for deploying the Harmonic Universe application to various environments, with a focus on Render.com.

## Prerequisites

Before deploying the application, ensure you have:

1. A GitHub account with the repository cloned
2. A Render.com account
3. A PostgreSQL database service (provided by Render or external)
4. The necessary environment variables prepared

## Environment Variables

The application requires the following environment variables:

### Backend

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for JWT token generation
- `FLASK_ENV`: Environment type (production, development)
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)
- `REDIS_URL`: Redis connection string (optional, for rate limiting)

### Frontend

- `VITE_API_URL`: URL to the backend API
- `VITE_WEBSOCKET_URL`: WebSocket URL (if applicable)

## Deployment to Render.com

### Using render.yaml (Recommended)

The easiest way to deploy the application is using the provided `render.yaml` file:

1. Fork the repository to your GitHub account
2. Log in to Render.com
3. Go to the Dashboard and click "New Blueprint"
4. Select your GitHub repository
5. Render will automatically detect the `render.yaml` file
6. Review the configuration and click "Apply"
7. Render will set up all services defined in the YAML file

### Manual Deployment

#### Backend Deployment

1. In your Render dashboard, click "New Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - Name: `harmonic-universe-api`
   - Environment: `Python`
   - Build Command: `cd backend && pip install -r requirements.txt && python setup_db.py`
   - Start Command: `cd backend && gunicorn --workers=2 --timeout=120 --bind=0.0.0.0:$PORT wsgi:app`
   - Add the required environment variables
4. Click "Create Web Service"

#### Frontend Deployment

1. In your Render dashboard, click "New Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - Name: `harmonic-universe-app`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Add the required environment variables
4. Click "Create Static Site"

#### Database Deployment

1. In your Render dashboard, click "New PostgreSQL"
2. Configure the database:
   - Name: `harmonic-universe-db`
   - Database: `harmonic_universe`
   - User: `harmonic_user`
3. Click "Create Database"
4. Once created, copy the "Internal Database URL" to use as `DATABASE_URL` for the backend

## Continuous Deployment

Render.com automatically deploys your application when you push changes to the main branch. To customize this:

1. Go to your service settings
2. Navigate to the "Deploy" tab
3. Configure branch and auto-deploy settings

## Database Migrations

Database migrations will be applied automatically during deployment if you use the `render.yaml` file. For manual deployment:

1. Connect to your Render shell
   ```bash
   render shell <backend-service-name>
   ```

2. Run migrations
   ```bash
   cd backend
   flask db upgrade
   ```

## Monitoring

After deployment, you can monitor your application using:

1. Render logs: Available in the "Logs" tab of each service
2. Custom monitoring tools: Integrate services like Sentry or New Relic using their respective SDKs

## Troubleshooting

Common issues and solutions:

### Database Connection Issues

- Verify the `DATABASE_URL` environment variable is correct
- Check if the database is accessible from the backend service
- Ensure database migrations have been applied

### Frontend API Connection Issues

- Verify the `VITE_API_URL` points to the correct backend URL
- Check CORS configuration in the backend
- Ensure the backend service is running

### Deployment Failed

- Check the build logs for errors
- Verify your repository has the correct directory structure
- Ensure all required files are present
- Check for any syntax errors in your code

## Local Testing Before Deployment

To test your deployment configuration locally:

1. Create a `.env` file in both frontend and backend directories
2. Add all required environment variables
3. Run the application in production mode:
   ```bash
   # Backend
   cd backend
   export FLASK_ENV=production
   gunicorn --workers=2 --bind=0.0.0.0:5001 wsgi:app
   
   # Frontend
   cd frontend
   npm run build
   npm run preview
   ```

## Security Considerations

1. Always use HTTPS for production deployments
2. Secure your database with strong passwords
3. Regularly update dependencies
4. Use environment variables for all sensitive information
5. Implement rate limiting for API endpoints

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test user registration and login
- [ ] Test universe creation and management
- [ ] Test scene creation and interaction
- [ ] Check for any console errors
- [ ] Verify responsive design on mobile devices
- [ ] Test database operations
- [ ] Monitor for any performance issues 