# Test Organization

This directory contains all tests for the Harmonic Universe backend. The tests are organized into different categories to ensure comprehensive coverage of the application's functionality.

## Directory Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── test_auth_routes.py
│   ├── test_universe_routes.py
│   ├── test_storyboard_routes.py
│   ├── test_scene_routes.py
│   └── test_physics_routes.py
├── unit/                   # Unit tests for models and utilities
│   ├── test_scene.py
│   ├── test_physics_object.py
│   └── test_physics_constraint.py
├── conftest.py            # Test fixtures and configuration
├── run_tests.sh           # Test runner script
└── README.md              # This file
```

## Test Categories

### 1. Model Tests (unit/)
- Tests for data models and their relationships
- Validation methods
- Model-specific utility functions
- Database operations

### 2. API Tests (api/)
- Route functionality
- Request/response handling
- Authentication and authorization
- Input validation
- Error handling

## Running Tests

### Using the Test Runner Script

The easiest way to run all tests is using the provided script:

```bash
./run_tests.sh
```

This will:
1. Set up a virtual environment if needed
2. Install dependencies
3. Run linting checks
4. Run type checking
5. Run security checks
6. Run unit tests with coverage
7. Run API tests
8. Generate coverage reports

### Running Specific Test Categories

To run specific test categories:

```bash
# Run all unit tests
pytest tests/unit -v

# Run all API tests
pytest tests/api -v

# Run a specific test file
pytest tests/api/test_physics_routes.py -v

# Run tests with coverage
coverage run -m pytest
coverage report
coverage html
```

### Test Configuration

Test configuration and fixtures are defined in `conftest.py`. This includes:
- Database setup and teardown
- Authentication helpers
- Common test fixtures
- Test environment configuration

## Writing Tests

### Guidelines

1. **Organization**:
   - Place API tests in the `api/` directory
   - Place model and utility tests in the `unit/` directory
   - Use appropriate fixtures from `conftest.py`

2. **Naming**:
   - Test files should be named `test_*.py`
   - Test functions should be named `test_*`
   - Use descriptive names that indicate what is being tested

3. **Structure**:
   - Each test should focus on a single functionality
   - Use clear assertions
   - Include both positive and negative test cases
   - Test edge cases and error conditions

4. **Documentation**:
   - Include docstrings explaining what each test does
   - Document any complex test setup or assertions
   - Update this README when adding new test categories

### Example Test

```python
def test_create_physics_object(client, auth, test_scene):
    """Test creating a physics object."""
    auth.login()

    response = client.post(f'/api/scenes/{test_scene.id}/physics/objects', json={
        'name': 'Test Object',
        'object_type': 'circle',
        'mass': 1.0,
        'position': {'x': 100, 'y': 100},
        'dimensions': {'radius': 25}
    })

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Object'
    assert data['object_type'] == 'circle'
```

## Coverage Requirements

- Aim for 100% coverage of models and routes
- Document any intentionally uncovered code
- Run coverage reports regularly to identify gaps

## Continuous Integration

Tests are automatically run in the CI pipeline on:
- Every push to main branch
- Every pull request
- Nightly builds

## Troubleshooting

Common issues and solutions:

1. **Database errors**:
   - Ensure PostgreSQL is running
   - Check database credentials in test config
   - Run `flask db upgrade` to apply migrations

2. **Import errors**:
   - Verify virtual environment is activated
   - Install dependencies: `pip install -r requirements.txt`
   - Check Python path settings

3. **Failed tests**:
   - Check test logs for specific errors
   - Verify test database is clean
   - Ensure all dependencies are installed
   - Check for conflicting test data
