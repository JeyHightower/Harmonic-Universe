# Render.com Deployment Guide for Harmonic Universe

This guide provides instructions for deploying the Harmonic Universe application on Render.com with the updated Node.js configuration.

## Prerequisites

- A Render.com account
- Your code pushed to a Git repository (GitHub, GitLab, etc.)
- Basic understanding of Node.js and Python applications

## Updated Configuration Files

We have created the following files to facilitate deployment:

1. `fix-render-build.sh` - A script that properly initializes Node.js before running the build process
2. `frontend/serve.js` - An Express server to serve the static files after building
3. `render.yaml` - A Render Blueprint file with updated service configurations

## Deployment Steps

### Option 1: Deploy using Render Blueprint (Recommended)

1. Connect your Git repository to Render.com
2. Navigate to the Blueprint section in your Render dashboard
3. Select "New Blueprint Instance"
4. Choose your repository and branch
5. Render will automatically detect the `render.yaml` file and set up your services

### Option 2: Manual Deployment

#### Frontend Service (Node.js)

1. Create a new Web Service on Render
2. Select your repository
3. Configure the service:

   - Name: `harmonic-universe-frontend` (or your preferred name)
   - Runtime: `Node`
   - Build Command: `./fix-render-build.sh`
   - Start Command: `cd frontend && npm run serve`

4. Add the following environment variables:
   - `NODE_VERSION`: `18.19.0`
   - `ROLLUP_SKIP_NODEJS_NATIVE_BUILD`: `true`
   - `ROLLUP_NATIVE_PURE_JS`: `true`
   - `ROLLUP_DISABLE_NATIVE`: `true`
   - `NODE_OPTIONS`: `--max-old-space-size=4096 --experimental-vm-modules`
   - Various NPM config variables as defined in the render.yaml file

#### Backend Service (Python)

1. Create another Web Service for the backend
2. Configure as follows:

   - Name: `harmonic-universe-backend` (or your preferred name)
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt && python -m pip install gunicorn`
   - Start Command: `gunicorn wsgi:app`

3. Add the necessary environment variables, including database connection strings

## Troubleshooting

### Common Issues

1. **npm not found**:

   - This is now resolved by using the `fix-render-build.sh` script, which properly initializes Node.js

2. **ENOTEMPTY errors**:

   - The build script includes cleanup steps to prevent these errors

3. **ESM/CommonJS import issues**:
   - The `fix-deploy.sh` script addresses these issues by patching problematic modules

### Still Having Problems?

If you encounter issues:

1. Check the build logs on Render.com for specific error messages
2. Make sure all scripts are executable (`chmod +x *.sh`)
3. Verify that your `package.json` includes the `serve` script
4. Ensure Express is installed (either as a dependency or via the build script)

## Maintenance

To update your application:

1. Push changes to your Git repository
2. Render will automatically detect changes and rebuild your application

For major updates to the build process:

1. Update the `fix-render-build.sh` script as needed
2. Update the `render.yaml` file if service configurations change
3. Update the `serve.js` file if serving logic needs to change
