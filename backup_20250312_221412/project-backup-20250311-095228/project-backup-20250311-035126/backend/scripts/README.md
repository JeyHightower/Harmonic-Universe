# Backend Scripts

This directory contains various scripts for managing the application's lifecycle, from initialization to maintenance and testing.

## Core Scripts

### initialize.py

The main initialization script that sets up the entire application environment. It handles:

- Directory creation
- Environment setup
- Database initialization
- Migration execution
- Test environment setup
- Documentation generation

Usage:

```bash
python scripts/initialize.py --env [development|test|production]
```

### run_tests.py

Comprehensive test runner with coverage reporting and result analysis.

Usage:

```bash
python scripts/run_tests.py [--coverage] [--verbose] [--test-path path/to/tests]
```

## Database Scripts

### init_db.py

Initializes the database schema and creates necessary tables.

Usage:

```bash
python scripts/init_db.py --env [development|test|production]
```

### verify_db.py

Verifies database setup and schema integrity.

Usage:

```bash
python scripts/verify_db.py --env [development|test|production]
```

### db_ops.py

Database maintenance operations like backup, restore, and health checks.

Usage:

```bash
python scripts/db_ops.py [--backup] [--restore path/to/backup] [--health-check]
```

## Maintenance Scripts

### cleanup.py

Cleans up temporary files and old logs.

Usage:

```bash
python scripts/cleanup.py [--older-than days]
```

### analyze_errors.py

Analyzes application error logs and generates reports.

Usage:

```bash
python scripts/analyze_errors.py [--log-file path/to/log] [--output path/to/report]
```

## Directory Structure

```
scripts/
├── README.md           # This file
├── initialize.py       # Main initialization script
├── run_tests.py       # Test runner
├── maintenance/       # Maintenance scripts
├── deployment/        # Deployment scripts
├── init.sql/         # SQL initialization files
└── db/               # Database management scripts
```

## Best Practices

1. Always run initialization script first when setting up a new environment
2. Keep test database separate from development/production
3. Regularly run maintenance scripts
4. Back up database before major operations
5. Check logs and error reports periodically

## Contributing

When adding new scripts:

1. Follow the existing naming convention
2. Add appropriate logging
3. Include error handling
4. Update this README
5. Add usage examples
