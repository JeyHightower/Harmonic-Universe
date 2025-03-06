# Deploying Harmonic Universe on Render.com

This guide explains how to deploy the Harmonic Universe application on Render.com using a multi-service approach for better reliability.

## Overview

The application is deployed as two separate services:

1. **Backend API Service**: Python Flask application
2. **Frontend Service**: React application

This separation provides several benefits:

- Cleaner deployment process for each technology stack
- Better resource allocation
- Simplified debugging and maintenance
- Improved reliability

## Prerequisites

- A Render.com account
- Your code pushed to a Git repository
- The render.yaml file properly configured

## Deployment Instructions

### 1. Connect Your Repository to Render

1. Log in to your Render dashboard
2. Click "New +" and select "Blueprint"
3. Connect your repository
4. Select the repository containing your application

### 2. Deploy Using Blueprint

Render will automatically detect the `render.yaml` file and create both services:

- **harmonic-universe-api**: The Flask backend API
- **harmonic-universe-frontend**: The React frontend
- **harmonic-universe-db**: The PostgreSQL database

### 3. Environment Variables

The `render.yaml` file already includes the necessary environment variables, but you may need to set up:

- `SECRET_KEY`: A secret key for JWT token generation (auto-generated)
- `DATABASE_URL`: Database connection string (auto-configured)

### 4. Monitoring Deployment

1. Render will show the build logs for each service
2. Check for any build errors in both services
3. Once deployed, test the API health endpoint: `https://harmonic-universe-api.onrender.com/api/health`
4. Verify the frontend loads at: `https://harmonic-universe-frontend.onrender.com`

## Troubleshooting

### API Service Issues

If the API service fails to deploy:

1. Check the build logs for Python dependency errors
2. Verify that all required Python packages are listed in `requirements.txt`
3. Ensure that your `app.py` is correctly configured

### Frontend Service Issues

If the frontend service fails:

1. Check for Node.js dependency errors in the build logs
2. Make sure `glob` is correctly installed as a dependency in `package.json`
3. Verify that all Node scripts can run without errors

#### ES Module vs CommonJS Issues

The project uses ES modules (`"type": "module"` in package.json), which can cause issues when using CommonJS modules like `glob`. Our solution:

##### CommonJS Files (.cjs extension)

We use the `.cjs` extension for files that need to use CommonJS syntax:

1. Files using `require()` are renamed with the `.cjs` extension
2. References in package.json are updated to point to the `.cjs` files
3. The build script automatically detects and converts CommonJS scripts

Example:

```javascript
// clean-ant-icons.cjs - CommonJS syntax
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Use as normal
const files = glob.sync('*.js');
```

This approach:

- Clearly separates ES modules from CommonJS modules
- Works reliably in all Node.js environments
- Doesn't require complex import patterns
- Follows Node.js best practices for mixed module systems

### Scripts Issues

The application includes several build scripts:

- `build.sh`: Used by backend service to install dependencies and automatically converts CommonJS scripts to .cjs
- `clean-ant-icons.cjs`: Uses CommonJS require() syntax to avoid ES module compatibility issues

If you encounter issues with these scripts:

1. Check that they have execute permissions (`chmod +x script_name.sh`)
2. Make sure line endings are Unix-style (LF, not CRLF)
3. Verify that the scripts are using the correct path references

## Maintenance

### Updating the Application

To update your deployed application:

1. Push changes to your Git repository
2. Render will automatically detect the changes and rebuild the services

### Scaling

If you need to scale your application:

1. Go to the service in your Render dashboard
2. Click on "Settings"
3. Update the service plan or instance count as needed

## Support

If you need further assistance:

- Check Render's documentation: https://render.com/docs
- Review build logs in the Render dashboard
- Contact your development team for application-specific issues
