# Harmonic Universe Test Suite

This directory contains the test suite for the Harmonic Universe backend. The tests are organized by functionality and use pytest as the testing framework.

## Test Structure

- `test_universe.py`: Tests for universe creation, retrieval, and management
- `test_physics.py`: Tests for physics parameter validation and updates
- `test_music.py`: Tests for music parameter validation and updates
- `test_integration.py`: Integration tests between different components
- `test_auth.py`: Authentication and authorization tests
- `test_websocket.py`: WebSocket connection and real-time update tests

## Running Tests

### Prerequisites

1. Make sure you have all dependencies installed:

```bash
pip install -r requirements.txt
```

2. Set up the test database:

```bash
flask db upgrade
```

### Running All Tests

To run the entire test suite with coverage:

```bash
python run_tests.py
```

### Running Specific Tests

To run a specific test file:

```bash
pytest tests/test_universe.py -v
```

To run a specific test function:

```bash
pytest tests/test_universe.py::test_create_universe -v
```

### Coverage Reports

After running the tests, coverage reports will be generated in:

- Terminal output (summary)
- `coverage_html_report/` directory (detailed HTML report)

To view the HTML coverage report, open `coverage_html_report/index.html` in your browser.

## Writing New Tests

When adding new tests:

1. Create a new test file if testing a new component
2. Follow the existing test structure and naming conventions
3. Use the provided fixtures in `conftest.py`
4. Add the new test file to `run_tests.py`
5. Update this README if adding new test categories

## Test Categories

### Unit Tests

- Individual component testing
- Function-level testing
- Parameter validation

### Integration Tests

- Component interaction testing
- Data flow between modules
- State management

### WebSocket Tests

- Connection handling
- Real-time updates
- Client synchronization

### Authentication Tests

- User registration
- Login/logout
- Token management
- Password reset

## Common Test Fixtures

Available fixtures (defined in `conftest.py`):

- `app`: Flask application instance
- `client`: Test client
- `session`: Database session
- `auth_headers`: Authentication headers
- `test_server`: WebSocket test server

## Best Practices

1. Keep tests focused and atomic
2. Use descriptive test names
3. Follow the Arrange-Act-Assert pattern
4. Clean up test data after each test
5. Use appropriate assertions
6. Document complex test scenarios
7. Handle async operations properly
8. Mock external services when necessary
