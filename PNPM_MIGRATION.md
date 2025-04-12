# Migration from npm to pnpm

This project has been migrated from npm to pnpm for dependency management. This document provides information about the changes and how to work with pnpm.

## What is pnpm?

pnpm is an alternative package manager for Node.js that offers several advantages over npm:

- Much faster installation times
- More efficient disk space usage (up to 80% savings)
- Strict dependency validation that prevents accessing packages not declared as dependencies
- Better support for monorepos through workspaces

## Project Structure

The project now uses a workspace setup with the following structure:

- Root (harmonic-universe)
  - frontend/
  - frontend/server/

## Changes Made

1. Removed all npm-specific files:
   - Removed package-lock.json
   - Removed all node_modules directories

2. Added pnpm configuration:
   - Created pnpm-workspace.yaml
   - Added .npmrc with pnpm settings

3. Updated scripts in package.json to use pnpm

## Working with pnpm

### Installation

If you haven't installed pnpm yet, you can install it globally:

```bash
npm install -g pnpm
```

### Common Commands

Instead of using npm commands, you'll now use pnpm:

| npm command      | pnpm command      | Description                 |
|------------------|-------------------|-----------------------------|
| npm install      | pnpm install      | Install dependencies        |
| npm i package    | pnpm add package  | Add a dependency            |
| npm run script   | pnpm run script   | Run a script                |
| npm run dev      | pnpm run dev      | Start development server    |
| npm run build    | pnpm run build    | Build the project           |

### Workspace Commands

This project uses workspaces. To run commands in specific workspaces:

```bash
# Run a command in the frontend workspace
pnpm --filter frontend run dev

# Install a dependency in a specific workspace
pnpm --filter frontend add package-name

# Run a command in all workspaces
pnpm -r run script-name
```

## Benefits

- Faster installation and dependency resolution
- Better disk space efficiency
- Consistent dependency structure
- Improved monorepo support

## Troubleshooting

If you encounter any issues:

1. Delete the node_modules directory and pnpm-lock.yaml
2. Run `pnpm install` again
3. If errors persist, check for compatibility issues in package.json

## Reverting (if necessary)

If you need to revert to npm:

1. Delete node_modules directory and pnpm-lock.yaml
2. Delete .npmrc and pnpm-workspace.yaml
3. Run `npm install` 