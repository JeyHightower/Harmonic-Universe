# Deploying Harmonic Universe to Render.com

This guide provides step-by-step instructions for deploying the Harmonic Universe application to Render.com, with specific focus on resolving ESM/CommonJS module compatibility issues.

## The Problem: ESM/CommonJS Import Compatibility

When deploying to Render.com, you might encounter the following error:

```
ReferenceError: require is not defined in ES module scope, you can use import instead
This file is being treated as an ES module because it has a '.js' file extension and '/opt/render/project/src/frontend/package.json' contains "type": "module".
```

This occurs because:

1. The project is configured as an ES module project with `"type": "module"` in package.json
2. Some scripts use CommonJS syntax (`require()`) instead of ES module syntax (`import`)
3. Rollup/Vite has compatibility issues with certain native modules in the cloud environment

## The Solution

The repository includes scripts to handle these issues:

1. Conversion of CommonJS script syntax to ES modules
2. Patching of the Rollup native module
3. Setting environment variables to disable native module functionality
4. Multiple build approaches with fallbacks

## Deployment Setup

### 1. Render.yaml Configuration

The `render.yaml` file is set up to:

- Install dependencies with flags to avoid common npm errors
- Make the fix scripts executable
- Run the deployment fix script
- Set required environment variables
- Configure SPA routing

### 2. Environment Variables

The following environment variables are set in the render.yaml file:

```
NODE_VERSION: 18.19.0
ROLLUP_SKIP_NODEJS_NATIVE_BUILD: true
ROLLUP_NATIVE_PURE_JS: true
ROLLUP_DISABLE_NATIVE: true
NODE_OPTIONS: --max-old-space-size=4096 --experimental-vm-modules
NPM_CONFIG_LEGACY_PEER_DEPS: true
NPM_CONFIG_FUND: false
NPM_CONFIG_AUDIT: false
NPM_CONFIG_PREFER_OFFLINE: true
NPM_CONFIG_IGNORE_SCRIPTS: true
```

### 3. Build Process

The build process:

1. Cleans problematic directories and clears caches
2. Installs dependencies with flags to avoid ENOTEMPTY errors
3. Patches the Rollup native module
4. Fixes problematic imports
5. Tries multiple build approaches with fallbacks

## Deployment Steps

1. Push changes to your repository
2. Connect your repository to Render.com
3. Use the render.yaml configuration for blueprint deployment
4. Or manually configure the service with settings from render.yaml

## Troubleshooting Common Issues

### ENOTEMPTY Errors

If you encounter ENOTEMPTY errors during npm installation:

- Use the `--no-fund --legacy-peer-deps --no-optional --ignore-scripts` flags
- Clean up node_modules directories before reinstalling

### Module Format Errors

If you encounter module format errors (require vs import):

- For scripts using CommonJS syntax, rename them to use .cjs extension
- Or convert the scripts to use ES module syntax (import instead of require)

### Native Module Errors

If you encounter native module errors:

- Set the environment variables listed above
- Use the patch scripts to force pure JS implementations

## Local Testing

To test deployment locally:

```bash
# Navigate to the frontend directory
cd frontend

# Make scripts executable
chmod +x fix-deploy.sh build-render.js esm-build.js

# Run the deployment fix script
./fix-deploy.sh
```

## Verifying Deployment

After deployment:

1. Check the build logs for any errors
2. Visit the deployed site to ensure it loads correctly
3. Visit the /test.html page created during deployment for verification

## Conclusion

The provided scripts and configuration handle the complex interactions between ES modules and CommonJS modules, ensuring a successful deployment to Render.com. If you encounter any issues, check the build logs and review the specific error messages for guidance.
