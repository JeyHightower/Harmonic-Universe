# Harmonic Universe Scripts

This directory contains scripts to help manage the Harmonic Universe project.

## Organization

The scripts have been organized into the following categories:

- **Core**: Core utilities used by all scripts
  - `core.sh` - Core utilities and functions
  - `utils.sh` - Common utility functions

- **Development**: Scripts for development setup and server management
  - `setup.sh` - Set up the project environment
  - `dev.sh` - Start development servers
  - `build.sh` - Build the project for production

- **Deployment**: Scripts for deployment operations
  - `deploy.sh` - Deploy the project
  - `render.sh` - Utilities for Render deployment
  - `docker.sh` - Utilities for Docker operations

- **Maintenance**: Scripts for project maintenance
  - `clean.sh` - Clean up project artifacts
  - `fix.sh` - Fix common issues
  - `lint.sh` - Lint the codebase
  - `security-audit.sh` - Run security audits
  - `error-logger.sh` - Error logging utilities

- **Database**: Database management scripts
  - `db.sh` - Manage the database

- **Testing**: Scripts for running tests
  - `test.sh` - Run tests
  - `api_tests.sh` - Run API tests

## Master Script

The `harmonic.sh` script provides a unified interface to all scripts. It categorizes and routes commands to the appropriate scripts.

```bash
# Usage
./scripts/harmonic.sh <category> <command> [options]

# Examples
./scripts/harmonic.sh dev setup      # Setup development environment
./scripts/harmonic.sh dev start      # Start development servers
./scripts/harmonic.sh build all      # Build everything
./scripts/harmonic.sh deploy render  # Deploy to Render
./scripts/harmonic.sh db migrate     # Run database migrations
./scripts/harmonic.sh test all       # Run all tests
./scripts/harmonic.sh maintain clean # Clean project artifacts
```

## Frontend and Backend Scripts

Frontend and backend also have their own script directories with specific scripts:

- `frontend/scripts/` - Frontend-specific scripts
- `backend/scripts/` - Backend-specific scripts

These scripts are component-specific and should be used for operations related to their respective components.

## Organization Within Component Scripts

Each component (frontend/backend) follows a similar organization structure:

- `setup.sh` - Environment setup
- `dev.sh` - Development servers
- Specialized scripts for component-specific operations 