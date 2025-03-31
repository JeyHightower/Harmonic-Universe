# Harmonic Universe - Fix Scripts & Deployment Utilities

This document contains information about scripts to fix common issues with the Harmonic Universe application and deploy it successfully.

## Deployment Scripts

### Render.com Deployment

The project includes two main scripts for deployment on Render.com:

#### render-build.sh

Handles the build process:

- Installs frontend dependencies and builds the React application with Vite
- Sets up the backend environment (with Poetry if available, otherwise pip)
- Validates the database connection and runs migrations
- Copies the frontend build to the backend static directory

#### render-start.sh

Starts the application in production:

- Activates the virtual environment
- Ensures any pending migrations are applied
- Starts the application with Gunicorn (or falls back to Flask development server)

### Using the Deployment Scripts

In your Render.com web service configuration:

```
Build command: ./render-build.sh
Start command: ./render-start.sh
```

## Troubleshooting

### Common Issues

#### Frontend Build Failures

If the frontend build fails:

- Check for Node.js version compatibility (project uses Node 16+)
- Clear node_modules and reinstall dependencies with `npm ci`
- Verify all environment variables are correctly set

#### Backend Startup Issues

If the backend fails to start:

- Check the application logs in Render dashboard
- Verify database connection using the DATABASE_URL
- Ensure all required Python packages are installed

#### Database Connection Problems

- Validate the DATABASE_URL format
- Check if the database server is accessible from the web service
- Ensure all required database extensions are enabled

### Development Setup Issues

#### npm start errors

If `npm start` fails in development:

- Ensure you have separate terminals running for frontend and backend
- Check that all environment variables in `.env` files are correctly set
- Verify the Node.js version (16+ recommended)

#### API Connection Issues

If the frontend cannot connect to the backend:

- Ensure the backend is running on the expected port (default: 5000)
- Check the VITE_API_BASE_URL environment variable in the frontend
- Verify the proxy settings in the Vite configuration

## Manual Fixes

If you encounter persistent issues:

1. Clear dependencies and reinstall:

   ```bash
   rm -rf frontend/node_modules
   rm -rf backend/.venv
   npm --prefix frontend ci
   cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
   ```

2. Regenerate the database (development only):

   ```bash
   cd backend
   source .venv/bin/activate
   flask db drop
   flask db create
   flask db migrate
   flask db upgrade
   ```

3. Rebuild the frontend with detailed logging:
   ```bash
   cd frontend
   npm run build -- --debug
   ```

## Additional Resources

For more detailed deployment information, see the [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) file.
