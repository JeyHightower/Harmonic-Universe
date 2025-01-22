describe('Application Initialization', () => {
  beforeEach(() => {
    // Clear local storage and service worker before each test
    cy.clearLocalStorage();
    cy.window().then(win => {
      if (win.navigator && win.navigator.serviceWorker) {
        win.navigator.serviceWorker.ready.then(registration => {
          registration.unregister();
        });
      }
    });
  });

  describe('App Startup', () => {
    it('should load the application successfully', () => {
      cy.visit('/');
      // Verify root element exists
      cy.get('#root').should('exist');
      // Verify initial route renders
      cy.url().should('include', '/');
    });

    it('should initialize Redux store', () => {
      cy.visit('/');
      // Verify Redux store is initialized with default state
      cy.window().its('store').should('exist');
      cy.window().its('store.getState').should('exist');
    });

    it('should register service worker in production', () => {
      // Mock production environment
      cy.window().then(win => {
        win.env = { NODE_ENV: 'production' };
      });
      cy.visit('/');
      // Verify service worker registration
      cy.window().then(win => {
        expect(win.navigator.serviceWorker.controller).to.exist;
      });
    });
  });

  describe('Provider Setup', () => {
    it('should set up Redux provider', () => {
      cy.visit('/');
      // Verify Redux provider is working
      cy.window().its('store.dispatch').should('be.a', 'function');
    });

    it('should set up router provider', () => {
      cy.visit('/');
      // Verify router navigation works
      cy.get('a[href="/login"]').click();
      cy.url().should('include', '/login');
    });

    it('should set up theme provider', () => {
      cy.visit('/');
      // Verify theme context is available
      cy.window().its('theme').should('exist');
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and handle render errors', () => {
      // Mock a component that throws an error
      cy.window().then(win => {
        win.throwError = true;
      });
      cy.visit('/');
      // Verify error boundary catches the error
      cy.get('[data-testid="error-boundary"]').should('be.visible');
    });

    it('should provide error recovery options', () => {
      // Mock a recoverable error
      cy.window().then(win => {
        win.throwRecoverableError = true;
      });
      cy.visit('/');
      // Verify retry button is available
      cy.get('[data-testid="error-retry"]').should('be.visible');
    });

    it('should handle multiple nested error boundaries', () => {
      // Mock nested errors
      cy.window().then(win => {
        win.throwNestedError = true;
      });
      cy.visit('/');
      // Verify correct error boundary catches the error
      cy.get('[data-testid="nested-error-boundary"]').should('be.visible');
    });
  });

  describe('Performance Monitoring', () => {
    it('should initialize performance monitoring', () => {
      cy.visit('/');
      // Verify performance monitoring is set up
      cy.window().its('performance').should('exist');
    });

    it('should track initial page load metrics', () => {
      cy.visit('/');
      // Verify metrics are being collected
      cy.window().then(win => {
        expect(
          win.performance.getEntriesByType('navigation')
        ).to.have.length.above(0);
      });
    });

    it('should handle performance observer errors', () => {
      // Mock performance observer error
      cy.window().then(win => {
        win.performanceObserverError = true;
      });
      cy.visit('/');
      // Verify error is handled gracefully
      cy.window().its('performanceMonitoring.error').should('exist');
    });
  });

  describe('Environment Setup', () => {
    it('should load environment variables', () => {
      cy.visit('/');
      // Verify environment variables are loaded
      cy.window().its('env').should('exist');
    });

    it('should handle missing environment variables', () => {
      // Mock missing environment variables
      cy.window().then(win => {
        win.env = {};
      });
      cy.visit('/');
      // Verify fallback values are used
      cy.window().its('env.API_URL').should('exist');
    });

    it('should validate required environment variables', () => {
      // Mock invalid environment setup
      cy.window().then(win => {
        win.env = { REQUIRED_VAR: undefined };
      });
      cy.visit('/');
      // Verify validation error is handled
      cy.get('[data-testid="env-error"]').should('be.visible');
    });
  });
});
