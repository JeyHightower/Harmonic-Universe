# Harmonic Universe Testing Script

## Overview

This script (`testing.sh`) is a comprehensive test suite for the Harmonic Universe application. It consolidates all testing functionality previously spread across multiple scripts into a single, modular testing tool.

## Features

- Authentication API testing
- General API integration testing
- Backend unit/integration testing
- Frontend unit testing
- Linting checks for both frontend and backend

## Prerequisites

- Backend server running on port 5001
- Python virtual environment set up in `backend/venv`
- Frontend dependencies installed in `frontend/node_modules`
- curl installed (required for API tests)
- jq installed (optional but recommended for better API test output parsing)

## Usage

```bash
./scripts/testing.sh <command> [arg]
```

### Commands

- `auth` - Run authentication API tests only
- `api` - Run general API integration tests only
- `backend [path]` - Run backend tests (optional specific path)
- `frontend` - Run frontend tests only
- `lint` - Run linting checks only
- `all` - Run all tests (default)
- `help` - Show help message

### Examples

```bash
# Run all tests
./scripts/testing.sh all

# Run only authentication tests
./scripts/testing.sh auth

# Run only backend tests
./scripts/testing.sh backend

# Run backend tests for a specific module
./scripts/testing.sh backend app/models

# Run only linting checks
./scripts/testing.sh lint
```

## Output

The script provides color-coded output:
- Green: Success messages
- Red: Error messages
- Blue: Information messages
- Yellow: Warning messages

At the end of execution, a summary of passed and failed tests is displayed.

## Notes

- The script automatically checks if the backend server is running before executing API tests
- For API tests, the script creates test entities and cleans them up afterward
- Authentication tests use a temporary test user with credentials:
  - Email: test@example.com
  - Password: TestPass123!

## Integration with Other Scripts

This testing script is integrated with the `harmonic.sh` master script and can be invoked via:

```bash
./backend/scripts/harmonic.sh test <command> [arg]
``` 