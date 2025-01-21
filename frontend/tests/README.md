# Frontend Test Suite Structure

## Unit Tests

### Component Tests

- `components/Auth/Auth.test.jsx`
- `components/Universe/Universe.test.jsx`
- `components/Physics/Physics.test.jsx`
- `components/Audio/Audio.test.jsx`
- `components/Common/Common.test.jsx`

### Redux Tests

- `redux/slices/authSlice.test.js`
- `redux/slices/universeSlice.test.js`
- `redux/slices/physicsSlice.test.js`
- `redux/slices/audioSlice.test.js`
- `redux/store.test.js`

### Hook Tests

- `hooks/useAuth.test.js`
- `hooks/useUniverse.test.js`
- `hooks/usePhysics.test.js`
- `hooks/useAudio.test.js`
- `hooks/useWebSocket.test.js`

### Utility Tests

- `utils/auth.test.js`
- `utils/universe.test.js`
- `utils/physics.test.js`
- `utils/audio.test.js`
- `utils/websocket.test.js`

## Integration Tests

### Page Tests

- `pages/Login.test.jsx`
- `pages/Register.test.jsx`
- `pages/Dashboard.test.jsx`
- `pages/Universe.test.jsx`
- `pages/Settings.test.jsx`

### Feature Tests

- `features/Authentication.test.jsx`
- `features/UniverseCreation.test.jsx`
- `features/PhysicsSimulation.test.jsx`
- `features/AudioGeneration.test.jsx`
- `features/Collaboration.test.jsx`

### API Integration Tests

- `api/auth.test.js`
- `api/universe.test.js`
- `api/physics.test.js`
- `api/audio.test.js`
- `api/websocket.test.js`

## End-to-End Tests

### User Flows

- `cypress/e2e/auth/registration.cy.js`
- `cypress/e2e/auth/login.cy.js`
- `cypress/e2e/universe/creation.cy.js`
- `cypress/e2e/universe/editing.cy.js`
- `cypress/e2e/collaboration/realtime.cy.js`

### Visual Tests

- `cypress/e2e/visual/responsive.cy.js`
- `cypress/e2e/visual/themes.cy.js`
- `cypress/e2e/visual/animations.cy.js`
- `cypress/e2e/visual/accessibility.cy.js`

### Performance Tests

- `cypress/e2e/performance/load.cy.js`
- `cypress/e2e/performance/memory.cy.js`
- `cypress/e2e/performance/network.cy.js`
- `cypress/e2e/performance/rendering.cy.js`

## Test Utilities

### Fixtures

- `__fixtures__/auth.js`
- `__fixtures__/universe.js`
- `__fixtures__/physics.js`
- `__fixtures__/audio.js`
- `__fixtures__/websocket.js`

### Mocks

- `__mocks__/api.js`
- `__mocks__/websocket.js`
- `__mocks__/localStorage.js`
- `__mocks__/redux.js`

### Test Data

- `__test_data__/users.json`
- `__test_data__/universes.json`
- `__test_data__/physics.json`
- `__test_data__/audio.json`

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test components/Auth/Auth.test.jsx

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### End-to-End Tests

```bash
# Open Cypress
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run

# Run specific spec
npm run cypress:run --spec "cypress/e2e/auth/*.cy.js"
```

### Visual Regression Tests

```bash
# Run visual regression tests
npm run test:visual

# Update snapshots
npm run test:visual -- -u
```

## Test Configuration

### Jest Configuration

```javascript
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Cypress Configuration

```javascript
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
};
```

## Best Practices

### Component Testing

1. Test component rendering
2. Test user interactions
3. Test prop changes
4. Test state changes
5. Test error states
6. Test loading states

### Redux Testing

1. Test action creators
2. Test reducers
3. Test selectors
4. Test async thunks
5. Test store configuration
6. Test middleware

### Hook Testing

1. Test initial state
2. Test state updates
3. Test cleanup
4. Test error handling
5. Test dependencies
6. Test custom events

### End-to-End Testing

1. Test critical user paths
2. Test error scenarios
3. Test responsive design
4. Test performance metrics
5. Test accessibility
6. Test cross-browser compatibility
