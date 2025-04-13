# Harmonic Universe Scripts

This directory contains various scripts to manage the Harmonic Universe application. The scripts are organized by their purpose to make it easier to find and maintain them.

## Directory Structure

- **database/** - Scripts for database management and operations
  - `db.sh` - Database management utilities

- **deployment/** - Scripts for deploying the application
  - `deploy.sh` - Deploy the application to Render.com

- **development/** - Scripts for development workflows
  - `lint.sh` - Code linting and formatting utilities
  - `start.sh` - Start development environment

- **maintenance/** - Scripts for system maintenance and setup
  - `setup.sh` - Initial setup and configuration
  - `cleanup.sh` - Cleanup utilities for development environment

- **testing/** - Scripts for testing
  - `testing.sh` - Testing utilities
  - `README-testing.md` - Documentation for testing scripts

## Usage

Most scripts can be run directly from the project root:

```bash
./scripts/database/db.sh [options]
./scripts/deployment/deploy.sh [options]
# etc.
```

Refer to individual script documentation or help flags for more details. 