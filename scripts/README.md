# Harmonic Universe Scripts

This directory contains all utility scripts for the Harmonic Universe project. The scripts are organized into the following categories:

## Directory Structure

- `setup/` - Setup and initialization scripts
  - Environment setup
  - Database initialization
  - Development environment setup
  - Production environment setup

- `build/` - Build scripts
  - Frontend build
  - Backend build
  - Docker build
  - Production build

- `deploy/` - Deployment scripts
  - Deployment automation
  - Environment configuration
  - Service deployment
  - Monitoring setup

## Core Scripts

1. Codebase Management
   - `codebase_cleanup.py` - Clean and organize codebase
   - `route_parser.py` - Parse and document API routes

2. Development Tools
   - `dev.sh` - Development environment setup
   - `run_tests.sh` - Test execution
   - `setup_dev.sh` - Development environment initialization

3. Database Scripts
   - Database migrations
   - Seeding scripts
   - Backup scripts
   - Restore scripts

## Script Standards

1. Script Organization
   - Clear purpose and functionality
   - Proper documentation
   - Error handling
   - Logging

2. Script Development
   - Follow consistent style
   - Include help/usage information
   - Implement proper error handling
   - Add logging and monitoring

3. Security
   - Handle sensitive data properly
   - Implement access controls
   - Follow security best practices
   - Regular security reviews

## Using Scripts

1. Setup Scripts
   ```bash
   # Development setup
   ./scripts/setup/dev.sh

   # Production setup
   ./scripts/setup/prod.sh
   ```

2. Build Scripts
   ```bash
   # Build frontend
   ./scripts/build/frontend.sh

   # Build backend
   ./scripts/build/backend.sh
   ```

3. Deploy Scripts
   ```bash
   # Deploy to staging
   ./scripts/deploy/staging.sh

   # Deploy to production
   ./scripts/deploy/production.sh
   ```

## Script Development

1. Creating New Scripts
   - Follow existing patterns
   - Add proper documentation
   - Include error handling
   - Add logging

2. Script Maintenance
   - Keep scripts updated
   - Remove obsolete scripts
   - Update documentation
   - Regular testing

3. Script Documentation
   - Clear usage instructions
   - Document dependencies
   - Example usage
   - Troubleshooting guide

## Contributing

1. Follow script standards
2. Test thoroughly
3. Document properly
4. Review security implications
5. Maintain quality

For more information about scripts, please see the [Development Guide](../docs/setup/README.md).
