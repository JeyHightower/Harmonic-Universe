# Frontend Scripts

This directory contains scripts specific to the frontend of the Harmonic Universe project.

## Available Scripts

- `setup.sh` - Set up the frontend environment
- `dev.sh` - Start the frontend development server
- `build.sh` - Build the frontend for production

## Directory Structure

- `core/` - Contains core utility scripts
- `utils/` - Contains utility scripts for various tasks
- `dev/` - Contains development-specific scripts
- `backup/` - Contains backup of redundant scripts

## Core Utilities

The scripts have been simplified for better maintainability:

- `core/build.mjs` - Comprehensive build script
- `core/react.mjs` - React-related utilities
- `core/ant-icons.mjs` - Ant Icons utilities

## Usage

```bash
# Setup the frontend
./scripts/setup.sh

# Start the development server
./scripts/dev.sh

# Build for production
./scripts/build.sh

# Build with Rollup patching (for some environments)
./scripts/build.sh --patch-rollup
```

## Advanced Utilities

The directory also includes specialized scripts for:

- Performance monitoring (`performance.sh`)
- Accessibility testing (`accessibility.sh`)
- Frontend diagnostics (`diagnostics.sh`)
- Cache management (`cache-manager.sh`)

## Backup

Redundant scripts that have been replaced by core versions are stored in the `backup/` directory for reference. See `backup/README.md` for details.

These scripts use the core utilities from the root scripts directory. 