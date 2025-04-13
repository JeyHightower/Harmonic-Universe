# Core Scripts

This directory contains the core scripts used by the Harmonic Universe project. These scripts replace multiple individual scripts for better maintainability and performance.

## Available Scripts

- `build.mjs` - Main build script for the frontend
  - Handles both development and production builds
  - Manages bundling, optimization, and asset generation
  - Used by `../build.sh`

- `react.mjs` - React utilities
  - Provides common React component utilities
  - Handles React-specific optimizations
  - Used by various frontend components

- `ant-icons.mjs` - Ant Design icon utilities
  - Manages Ant Design icon loading and optimization
  - Reduces bundle size through icon tree-shaking
  - Used by components that leverage Ant Design icons

## Usage

These scripts are not intended to be run directly but are instead imported or executed by other scripts in the project. See the parent README (`../README.md`) for more information on how to use the main shell scripts.

## Benefits of Core Scripts

- Reduced code duplication
- Simplified maintenance
- Consistent behavior across different environments
- Improved build performance
- Better organization of utility functions 