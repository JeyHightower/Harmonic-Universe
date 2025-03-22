# Harmonic Universe Deployment Guide

This guide provides comprehensive instructions for deploying the Harmonic Universe application to Render.com.

## Prerequisites

- A Render.com account
- Git repository with your Harmonic Universe code
- Node.js (for local testing)
- Python 3.9 or later (for backend)

## Files for Deployment

The repository includes several important files for deployment:

1. `render.yaml` - Configuration for Render.com services
2. `frontend/fix-deploy.sh` - Script to fix frontend build issues
3. `frontend/package.json` - Frontend dependencies and scripts
4. `requirements.txt` - Backend dependencies

## Deployment Steps

### 1. Push Your Code to GitHub

Ensure your code is pushed to a GitHub repository that Render.com can access.

### 2. Deploy to Render.com

#### Option 1: Using Blueprint (Recommended)

1. Log in to your Render.com account
2. Click "New" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and configure the services
5. Review the settings and click "Apply"

#### Option 2: Manual Setup

If you prefer to set up services manually:

1. **Frontend Setup**:

   - Create a new "Static Site" in Render
   - Connect your GitHub repository
   - Set build command: `cd frontend && ./fix-deploy.sh`
   - Set publish directory: `frontend/dist`
   - Add environment variables:
     ```
     ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
     ROLLUP_NATIVE_PURE_JS=true
     ROLLUP_DISABLE_NATIVE=true
     NODE_OPTIONS=--max-old-space-size=4096 --experimental-vm-modules
     ```

2. **Backend Setup**:

   - Create a new "Web Service" in Render
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt && python -m pip install gunicorn`
   - Set start command: `gunicorn wsgi:app`
   - Add environment variables:
     ```
     PYTHON_VERSION=3.9.18
     ```

3. **Database Setup**:
   - Create a new PostgreSQL database in Render
   - Link the database to your web service

### 3. Configure Environment Variables

Make sure to add all necessary environment variables in the Render.com dashboard:

- API keys
- Database credentials
- Other configuration settings

### 4. Verify Deployment

1. Wait for the build to complete
2. Visit your deployed frontend URL
3. Check that the sample test page loads: `https://your-frontend-url.onrender.com/test.html`
4. Test API endpoints at: `https://your-backend-url.onrender.com/api/`

## Troubleshooting

### Common Issues and Solutions

1. **ESM/CommonJS Import Errors**:

   - These should be fixed by the `fix-deploy.sh` script
   - If problems persist, check the build logs for specific errors

2. **npm ENOTEMPTY Errors**:

   - These should be fixed by the environment variables
   - If they still occur, try increasing the NODE_OPTIONS memory limit

3. **Build Timeouts**:

   - Render has a 15-minute build timeout
   - Optimize the build process if needed

4. **Missing Dependencies**:
   - Check `requirements.txt` for backend dependencies
   - Check `package.json` for frontend dependencies

## Maintenance

### Updating Your Deployment

1. Push changes to your GitHub repository
2. Render will automatically rebuild and deploy

### Monitoring

1. Use Render's built-in logs to monitor your application
2. Set up alerts for any issues

## Contact and Support

If you encounter any deployment issues, please:

1. Check the build logs in Render.com dashboard
2. Review the error details in this guide
3. Contact the development team if the issue persists

## Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy)
- [Frontend README](./frontend/README.md)
