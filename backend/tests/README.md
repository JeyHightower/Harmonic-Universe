# Testing Strategy

## Directory Structure

````
tests/
├── unit/                 # Unit tests for individual components
│   ├── models/          # Model-specific tests
│   ├── services/        # Service layer tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
│   ├── api/            # API endpoint tests
│   ├── db/             # Database integration tests
│   └── services/       # Service integration tests
├── e2e/                # End-to-end tests
├── fixtures/           # Test fixtures and factory classes
├── utils/             # Test utilities and helpers
└── conftest.py        # Shared test configuration and fixtures

## Test Categories

### Unit Tests
- Model tests: Test individual model behavior
- Service tests: Test service layer logic
- Utility tests: Test helper functions

### Integration Tests
- API tests: Test API endpoints
- Database tests: Test database operations
- Service integration: Test service interactions

### End-to-End Tests
- Full workflow tests
- User journey tests
- System integration tests

## Test Conventions

### Naming Conventions
- Test files: `test_*.py`
- Test classes: `Test*`
- Test methods: `test_*`
- Fixture files: `*_fixtures.py`

### Test Structure
Each test should follow the Arrange-Act-Assert pattern:
```python
def test_something():
    # Arrange
    # Set up test data and conditions

    # Act
    # Perform the action being tested

    # Assert
    # Verify the results
````

### Database Tests

- Use transactions to isolate tests
- Reset database state between tests
- Use separate test database
- Use factory classes for test data

### Fixtures

- Keep fixtures focused and minimal
- Use factory classes for complex objects
- Share common fixtures in conftest.py
- Use scope appropriately (function/class/module/session)

### Mocking

- Mock external services
- Use dependency injection
- Keep mocks simple and focused
- Use fixture factories for complex mocks

## Best Practices

1. Test Independence

   - Each test should be independent
   - No test should depend on another test's state
   - Clean up after each test

2. Test Isolation

   - Use transactions for database tests
   - Mock external dependencies
   - Reset state between tests

3. Test Coverage

   - Aim for high coverage but focus on critical paths
   - Test edge cases and error conditions
   - Test both success and failure scenarios

4. Test Maintenance

   - Keep tests simple and readable
   - Use helper functions for common operations
   - Document complex test scenarios
   - Update tests when changing code

5. Performance
   - Use appropriate fixture scopes
   - Minimize database operations
   - Use test parallelization when possible

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
