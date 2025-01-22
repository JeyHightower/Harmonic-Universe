# Testing Documentation

## Overview

This document provides comprehensive information about the testing setup and procedures for the Harmonic Universe project.

## Directory Structure

```
tests/
├── setup/              # Test setup and configuration
│   ├── test-setup.js   # Frontend test setup
│   └── conftest.py     # Backend test setup
├── unit/               # Unit tests
│   ├── backend/        # Backend unit tests
│   └── frontend/       # Frontend unit tests
├── integration/        # Integration tests
│   ├── api/           # API integration tests
│   ├── db/            # Database integration tests
│   └── websocket/     # WebSocket integration tests
└── e2e/               # End-to-end tests
    ├── features/      # Feature-based E2E tests
    └── performance/   # Performance and load tests
```

## Test Categories

### Unit Tests

- **Backend Unit Tests**: Test individual Python modules, classes, and functions
- **Frontend Unit Tests**: Test React components and utility functions
- **Coverage Requirements**: 80% for backend, 75% for frontend

### Integration Tests

- **API Tests**: Test REST API endpoints
- **Database Tests**: Test database operations and models
- **WebSocket Tests**: Test real-time communication

### End-to-End Tests

- **Feature Tests**: Test complete user workflows
- **Performance Tests**: Test system under load
- **Browser Tests**: Test cross-browser compatibility

## Running Tests

### All Tests

```bash
./run_all_tests.sh
```

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest                     # Run all tests
pytest tests/unit         # Run unit tests
pytest tests/integration  # Run integration tests
pytest -m "not slow"      # Skip slow tests
```

### Frontend Tests

```bash
cd frontend
npm test                  # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e        # Run E2E tests
```

### Performance Tests

```bash
cd tests/k6
k6 run api.js           # Run API load tests
k6 run websocket.js     # Run WebSocket load tests
```

## Test Configuration

### Backend Configuration

- **pytest.ini**: Main pytest configuration
- **conftest.py**: Test fixtures and setup
- **.coveragerc**: Coverage configuration

### Frontend Configuration

- **vitest.config.js**: Vitest configuration
- **cypress.config.js**: Cypress configuration
- **test-setup.js**: Test environment setup

## Writing Tests

### Backend Tests

```python
# Example unit test
def test_universe_creation():
    universe = Universe(name="Test Universe")
    assert universe.name == "Test Universe"

# Example API test
def test_universe_api(client):
    response = client.post('/api/universes', json={
        'name': 'Test Universe'
    })
    assert response.status_code == 201
```

### Frontend Tests

```javascript
// Example component test
describe('UniverseCard', () => {
  it('renders universe details', () => {
    render(<UniverseCard name="Test Universe" />);
    expect(screen.getByText('Test Universe')).toBeInTheDocument();
  });
});

// Example E2E test
describe('Universe Creation', () => {
  it('creates a new universe', () => {
    cy.visit('/universes/new');
    cy.get('[data-testid="name-input"]').type('Test Universe');
    cy.get('[data-testid="create-button"]').click();
    cy.url().should('include', '/universes/');
  });
});
```

## Test Reports

### Location

- Backend coverage: `test-results/backend-coverage/`
- Frontend coverage: `test-results/frontend-coverage/`
- E2E results: `test-results/e2e/`
- Combined report: `test-results/summary.txt`

### Format

```
Test Results Summary
===================

Backend Tests:
- Unit Test Coverage: XX%
- Integration Test Coverage: XX%
- API Test Coverage: XX%

Frontend Tests:
- Component Coverage: XX%
- Integration Coverage: XX%
- E2E Test Results: XX passed, XX failed

Performance Tests:
- API Response Time: XXms
- WebSocket Latency: XXms
```

## Continuous Integration

### GitHub Actions

- Runs on every pull request
- Runs on main branch commits
- Generates and uploads test reports

### Quality Gates

- All tests must pass
- Coverage requirements met
- Performance benchmarks met

## Troubleshooting

### Common Issues

1. **Database Connection**

   - Check database URL
   - Verify migrations
   - Check permissions

2. **WebSocket Tests**

   - Ensure Redis is running
   - Check WebSocket URL
   - Verify CORS settings

3. **Frontend Tests**
   - Clear test cache
   - Update dependencies
   - Check browser compatibility

### Debug Tools

- `pytest -vv`: Verbose test output
- `pytest --pdb`: Debug on failure
- `cy.debug()`: Cypress debugger
- Chrome DevTools

## Best Practices

1. **Test Organization**

   - One test file per module
   - Clear test descriptions
   - Proper use of fixtures

2. **Test Data**

   - Use factories for test data
   - Clean up after tests
   - Avoid test interdependence

3. **Performance**

   - Mock external services
   - Use appropriate scopes
   - Clean up resources

4. **Maintenance**
   - Regular test updates
   - Remove obsolete tests
   - Keep documentation current
