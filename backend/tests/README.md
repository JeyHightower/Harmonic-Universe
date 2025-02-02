# Testing Documentation

This directory contains all tests for the Harmonic Universe project. The tests are organized into the following structure:

```
tests/
├── unit/
│   ├── backend/     # Backend unit tests
│   └── frontend/    # Frontend unit tests
├── integration/
│   └── backend/     # Backend integration tests
└── e2e/
    └── frontend/    # Frontend end-to-end tests
```

## Running Tests

You can run all tests using the provided test runner script:

```bash
./tests/run_tests.sh
```

### Running Specific Test Suites

1. Backend Unit Tests:
```bash
python -m pytest tests/unit/backend
```

2. Backend Integration Tests:
```bash
python -m pytest tests/integration/backend
```

3. Frontend Unit Tests:
```bash
cd frontend && yarn test
```

4. Frontend E2E Tests:
```bash
cd frontend && yarn cypress run
```

## Coverage Reports

After running the tests, coverage reports will be generated in:
- HTML: `tests/coverage_html/`
- Terminal output shows missing lines

## Test Categories

### Backend Tests
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints and database interactions

### Frontend Tests
- **Unit Tests**: Test React components and utilities
- **E2E Tests**: Test full user workflows using Cypress

## Writing New Tests

1. Follow the existing directory structure
2. Name test files with `test_` prefix
3. Use descriptive test names
4. Include docstrings explaining test purpose
5. Follow the AAA pattern (Arrange, Act, Assert)

## Continuous Integration

Tests are automatically run on:
- Pull requests to main branch
- Direct pushes to main branch
- Nightly builds

## Troubleshooting

If tests fail:
1. Check test environment setup
2. Verify database migrations are up to date
3. Ensure all dependencies are installed
4. Check test logs for specific error messages

Last updated: Thu Jan 30 18:37:46 CST 2025
