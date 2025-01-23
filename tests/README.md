# Harmonic Universe Test Suite

## Overview

This test suite provides comprehensive testing for the Harmonic Universe application, covering both frontend and backend components.

## Test Categories

### Backend Tests

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **WebSocket Tests**: Real-time feature testing
- **Security Tests**: Security vulnerability testing
- **Performance Tests**: Load and stress testing

### Frontend Tests

- **Unit Tests**: Component and Redux testing
- **Integration Tests**: Feature integration testing
- **End-to-End Tests**: Full user journey testing

## Running Tests

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

### Backend Tests

```bash
# Install dependencies
cd backend
pip install -r requirements.txt
pip install -r requirements-test.txt

# Run all backend tests
pytest

# Run specific test categories
pytest tests/test_core_features.py
pytest tests/test_websocket.py
pytest tests/test_security.py
pytest tests/test_performance.py

# Run with coverage
pytest --cov=app --cov-report=term-missing
```

### Frontend Tests

```bash
# Install dependencies
cd frontend
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Open Cypress test runner
npm run test:e2e:open
```

## Test Configuration

### Backend

- `pytest.ini`: Main pytest configuration
- `conftest.py`: Test fixtures and setup
- `app/config.py`: Test environment settings

### Frontend

- `vitest.config.js`: Vitest configuration
- `cypress.config.js`: Cypress configuration
- `src/tests/setupTests.js`: Test setup and mocks

## Test Data

- Test database is automatically reset before each test run
- Fixtures provide consistent test data
- Mock data available for frontend tests

## Coverage Requirements

- Backend: 80% line coverage
- Frontend: 80% line coverage
- Critical paths: 100% coverage

## Continuous Integration

Tests are automatically run on:

- Every push to main branch
- Every pull request
- Nightly builds

## Test Reports

- Coverage reports generated after each test run
- Performance metrics tracked over time
- Security scan results included
- Available in GitHub Actions artifacts

## Best Practices

1. Write tests before implementing features
2. Keep tests focused and isolated
3. Use meaningful test descriptions
4. Mock external dependencies
5. Maintain test data fixtures
6. Regular test maintenance

## Troubleshooting

1. **Database Issues**

   ```bash
   flask reset-test-db
   ```

2. **WebSocket Test Failures**

   - Ensure Redis is running
   - Check WebSocket connection settings

3. **E2E Test Failures**
   - Verify both frontend and backend are running
   - Check test database state
   - Review Cypress screenshots and videos

## Contributing

1. Follow existing test patterns
2. Update test documentation
3. Maintain coverage requirements
4. Add test cases for bug fixes
