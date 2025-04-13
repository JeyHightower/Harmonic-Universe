# Frontend Scripts

This directory contains utility scripts for building and managing the Harmonic Universe frontend.

## Directory Structure

- `bin/` - Shell scripts for common operations
- `core/` - Core utility modules (ES modules)
- `utils/` - JavaScript utility scripts

## Available Commands

### Main Scripts

- `bin/setup.sh` - Set up the frontend environment
- `bin/dev.sh` - Start the development server
- `bin/build.sh` - Build the frontend for production

### Specialized Utilities

- `bin/accessibility.sh` - Run accessibility tests
- `bin/performance.sh` - Run performance tests
- `bin/diagnostics.sh` - Run frontend diagnostics
- `bin/cache-manager.sh` - Manage frontend caching

## Core Modules

The following core modules handle most of the complex functionality:

- `core/build.mjs` - Build process management
- `core/react.mjs` - React-related utilities
- `core/ant-icons.mjs` - Ant Icons patching and fallbacks

## Usage Examples

```bash
# Setup the frontend
./bin/setup.sh

# Start the development server
./bin/dev.sh

# Build for production
./bin/build.sh

# Run with Rollup patching (for some environments)
./bin/build.sh --patch-rollup
``` 