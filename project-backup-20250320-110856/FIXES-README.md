# Harmonic Universe - Fix Scripts

This repository contains several scripts to fix common issues with the Harmonic Universe application.

## Quick Start

For the fastest fix of all issues, run:

```bash
./fix-everything.sh
```

This will run all fix scripts in sequence with appropriate error handling.

## Individual Fix Scripts

### 1. Missing npm start script

```bash
./fix-start-script.sh
```

Fixes the `npm start` command in the frontend directory by adding or updating the start script in package.json.

### 2. ENOTEMPTY npm errors

```bash
./fix-enotempty.sh
```

Resolves the common ENOTEMPTY errors during npm installations by:

- Killing any hanging npm processes
- Cleaning up node_modules directories
- Creating optimal .npmrc configuration
- Clearing npm cache

### 3. Vite proxy errors

```bash
./fix-proxy-errors.sh
```

Resolves the constant proxy error messages when running Vite by:

- Creating an improved Vite configuration
- Adding middleware to handle API health endpoint
- Implementing better error handling for proxy connections

### 4. Rollup Linux GNU errors

```bash
./fix-rollup-linux-gnu.sh
```

Fixes issues with Rollup on Linux GNU systems by:

- Setting environment variables for native modules
- Creating configuration to use pure JS implementations

### 5. Comprehensive fixes

```bash
./fix-all-fixed.sh
```

A complete fix script that addresses multiple issues:

- Frontend build configuration
- Backend setup
- Deployment scripts creation

## Development Scripts

### Start the development environment

```bash
./start-dev.sh
```

Starts the frontend with mock API responses for the health endpoint to prevent proxy errors, and attempts to start the backend if available.

## Deployment

### Render.com deployment

```
Build command: chmod +x render-build-command.sh && ./render-build-command.sh
Start command: cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app
```

## Troubleshooting

If you still encounter issues:

1. Try running the individual fix scripts in this order:

   - `./fix-enotempty.sh`
   - `./fix-start-script.sh`
   - `./fix-proxy-errors.sh`
   - `./fix-rollup-linux-gnu.sh`

2. For npm installation issues:

   - Use yarn instead if available
   - Try installing with `--no-optional --ignore-scripts --legacy-peer-deps`

3. For Vite/proxy issues:
   - Make sure the backend is running on port 5000
   - Use the mock API configuration in `start-dev.sh`
