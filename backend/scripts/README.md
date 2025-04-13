# Backend Scripts

This directory contains scripts specific to the backend of the Harmonic Universe project.

## Available Scripts

- `setup.sh` - Set up the backend environment
- `dev.sh` - Start the backend development server
- `db.sh` - Manage the backend database

## Usage

```bash
# Setup the backend
./scripts/setup.sh

# Start the development server
./scripts/dev.sh

# Database operations
./scripts/db.sh help            # Show database operations
./scripts/db.sh init            # Initialize database
./scripts/db.sh migrate         # Create migrations
./scripts/db.sh upgrade         # Apply migrations
./scripts/db.sh reset           # Reset database
```

These scripts use the core utilities from the root scripts directory. 