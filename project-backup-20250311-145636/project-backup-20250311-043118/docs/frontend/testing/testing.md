# Testing Documentation

## Overview
The Harmonic Universe application uses a comprehensive testing strategy that includes unit tests, integration tests, end-to-end tests, security tests, and performance tests.

## Test Structure

### Backend Tests
```
backend/
├── tests/
│   ├── conftest.py           # Test configuration and fixtures
│   ├── test_core_features.py # Core functionality tests
│   ├── test_websocket.py     # WebSocket functionality tests
│   ├── test_security.py      # Security vulnerability tests
│   └── test_performance.py   # Performance and load tests
```

### Frontend Tests
```
frontend/
├── src/
│   ├── tests/
│   │   ├── setup/
│   │   │   ├── test-utils.js     # Test utilities and helpers
│   │   │   └── setupTests.js     # Test environment setup
│   │   ├── mocks/
│   │   │   ├── handlers.js       # API mock handlers
│   │   │   └── server.js         # Mock service worker setup
│   │   └── core_features.test.js # Core functionality tests
├── cypress/
│   └── e2e/
│       └── core_features.cy.js   # End-to-end tests
```

## Test Categories

### Unit Tests
- **Backend**: Individual Python module and function tests
- **Frontend**: React component and Redux slice tests

### Integration Tests
- **Backend**: API endpoint and database interaction tests
- **Frontend**: Feature integration and state management tests

### End-to-End Tests
- Complete user journey tests using Cypress
- Real browser testing of full application flow

### Security Tests
- SQL injection prevention
- XSS vulnerability testing
- CSRF protection
- Rate limiting
- Password security
- JWT token security
- File upload security

### Performance Tests
- Response time testing
- Concurrent request handling
- WebSocket performance
- Database query optimization
- Memory usage monitoring

## Running Tests

### Backend Tests
```bash
# All tests
npm run test:backend

# Specific categories
npm run test:security
npm run test:performance
npm run test:websocket

# With coverage
pytest --cov=app --cov-report=term-missing
```

### Frontend Tests
```bash
# All tests
npm run test:frontend

# Unit tests only
npm run test:unit

# Component tests
npm run test:components

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Test Configuration

### Backend Configuration
- **pytest.ini**: Test discovery and execution settings
- **conftest.py**: Shared fixtures and setup
- **app/config.py**: Test environment configuration

### Frontend Configuration
- **vitest.config.js**: Unit test configuration
- **cypress.config.js**: E2E test configuration
- **setupTests.js**: Test environment setup

## Test Data

### Database Fixtures
- Automatically reset before each test
- Consistent test data across all tests
- Isolated test database environment

### Mock Data
- API response mocking
- WebSocket event mocking
- File upload mocking
- Authentication mocking

## Continuous Integration

### GitHub Actions Workflow
- Automated test execution
- Coverage reporting
- Performance metrics
- Security scan results

### Quality Gates
- Minimum 80% test coverage
- All tests must pass
- No security vulnerabilities
- Performance thresholds met

## Best Practices

### Writing Tests
1. Follow AAA pattern (Arrange, Act, Assert)
2. Keep tests focused and isolated
3. Use meaningful test descriptions
4. Mock external dependencies
5. Test edge cases and error conditions

### Test Maintenance
1. Regular test updates with code changes
2. Periodic review of test coverage
3. Performance benchmark updates
4. Security test updates

### Code Quality
1. Linting before tests
2. Format checking
3. Type checking
4. Documentation updates

## Troubleshooting

### Common Issues
1. **Database Connection Issues**
   - Check database URL
   - Verify database service is running
   - Reset test database

2. **WebSocket Test Failures**
   - Check Redis connection
   - Verify WebSocket service
   - Check event handlers

3. **E2E Test Failures**
   - Verify application is running
   - Check test environment
   - Review test recordings

### Debug Tools
1. **Backend**
   - pytest-debug
   - Flask debug toolbar
   - Database query logger

2. **Frontend**
   - Vitest UI
   - Cypress Test Runner
   - React DevTools

## Contributing

### Adding Tests
1. Follow existing test patterns
2. Update test documentation
3. Maintain coverage requirements
4. Include performance considerations

### Review Process
1. Test code review
2. Coverage review
3. Performance impact review
4. Security consideration review

Last updated: Thu Jan 30 18:37:47 CST 2025
