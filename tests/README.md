# Harmonic Universe Testing

This directory contains all test files for the Harmonic Universe project. The tests are organized into the following categories:

## Directory Structure

- `frontend/` - Frontend tests
  - Unit tests for React components
  - Integration tests for features
  - Redux store tests
  - Service tests
  - Hook tests
  - Utility tests

- `backend/` - Backend tests
  - Unit tests for Python modules
  - Integration tests for APIs
  - Database tests
  - Service tests
  - Utility tests

- `e2e/` - End-to-end tests
  - Cypress tests
  - User flow tests
  - Feature tests
  - Cross-browser tests

## Test Standards

1. Test Organization
   - Group tests by feature/module
   - Follow consistent naming conventions
   - Maintain test independence
   - Use appropriate test categories

2. Test Coverage
   - Aim for high test coverage
   - Focus on critical paths
   - Include edge cases
   - Test error conditions

3. Test Quality
   - Write clear test descriptions
   - Use meaningful assertions
   - Avoid test interdependence
   - Keep tests maintainable

## Running Tests

1. Frontend Tests
   ```bash
   # Run all frontend tests
   cd frontend
   npm test

   # Run specific test file
   npm test -- path/to/test

   # Run with coverage
   npm test -- --coverage
   ```

2. Backend Tests
   ```bash
   # Run all backend tests
   cd backend
   pytest

   # Run specific test file
   pytest path/to/test

   # Run with coverage
   pytest --cov
   ```

3. E2E Tests
   ```bash
   # Run all e2e tests
   npm run cypress

   # Run specific test
   npm run cypress -- --spec "path/to/test"
   ```

## Test Development

1. Creating New Tests
   - Follow existing patterns
   - Include setup and teardown
   - Document test requirements
   - Add appropriate assertions

2. Test Maintenance
   - Keep tests up to date
   - Remove obsolete tests
   - Update test data
   - Refactor as needed

3. Test Documentation
   - Document test purpose
   - Include test requirements
   - Explain complex scenarios
   - Update test documentation

## Contributing

1. Follow test standards
2. Write comprehensive tests
3. Include test documentation
4. Review test coverage
5. Maintain test quality

For more information about testing, please see the [Testing Guide](../docs/testing/README.md).
