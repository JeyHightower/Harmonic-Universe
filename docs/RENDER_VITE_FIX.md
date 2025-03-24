# Quick Fix Guide for Vite Module Not Found Error on Render.com

## Error Message

```
Error: Cannot find module '/opt/render/project/src/frontend/node_modules/vite/bin/vite.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1077:15)
    at Module._load (node:internal/modules/cjs/loader:922:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}
Node.js v18.17.0
==> Build failed 😞
```

## Solution: Use Our New Build Command Script

The quickest solution is to use our new build command script that properly handles Vite installation and provides multiple fallbacks:

1. In your Render dashboard, go to your service > Settings > Build Command
2. Replace your current build command with:

```bash
chmod +x render-build-command.sh && ./render-build-command.sh
```

This script:

- Ensures Vite is properly installed before trying to use it
- Uses a specific version (4.5.1) for stability
- Checks if files exist before attempting to use them
- Includes multiple fallback methods if one approach fails
- Creates a maintenance page if all methods fail

## Manual Fix Option

If you prefer to fix the issue manually:

1. Update the build command in your Render.com dashboard to use npx with a specific version:

```bash
cd frontend && ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production npm install --no-optional && npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional && npx vite@4.5.1 build --mode production --emptyOutDir && cd .. && mkdir -p static && cp -r frontend/dist/* static/ && cd backend && python -m pip install --upgrade pip && python -m pip install -r requirements.txt && python -m pip install gunicorn
```

2. Update your frontend/package.json to use a specific version in the render-build script:

```json
"render-build": "ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production vite@4.5.1 build --mode production --emptyOutDir"
```

## Why This Happens

This error occurs because:

1. The Render.com build environment doesn't find the Vite executable
2. This could be because npm install didn't complete correctly
3. Using `--ignore-scripts` flag can prevent some necessary setup
4. Using `latest` instead of specific versions can cause incompatibilities

## Additional Resources

See the full deployment instructions in:

- RENDER_COMMANDS.md - Complete deployment commands and environment variables
- render.yaml - Blueprint configuration for setting up your service
