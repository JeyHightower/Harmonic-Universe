describe('API Integration', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('Request Handling', () => {
    it('should include auth token in requests when logged in', () => {
      // Login to get token
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 1, username: 'testuser' },
          token: 'test-jwt-token',
        },
      }).as('loginRequest');

      // Monitor protected request
      cy.intercept('GET', '/api/protected-route', req => {
        expect(req.headers.authorization).to.equal('Bearer test-jwt-token');
        req.reply({
          statusCode: 200,
          body: { success: true },
        });
      }).as('protectedRequest');

      // Login
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Make protected request
      cy.visit('/protected-page');
      cy.wait('@protectedRequest');
    });

    it('should handle requests without auth token when not logged in', () => {
      cy.intercept('GET', '/api/public-route', req => {
        expect(req.headers.authorization).to.be.undefined;
        req.reply({
          statusCode: 200,
          body: { success: true },
        });
      }).as('publicRequest');

      cy.visit('/public-page');
      cy.wait('@publicRequest');
    });
  });

  describe('Response Handling', () => {
    it('should handle successful responses', () => {
      cy.intercept('GET', '/api/data', {
        statusCode: 200,
        body: {
          data: 'test data',
        },
      }).as('successRequest');

      cy.visit('/data-page');
      cy.wait('@successRequest');
      cy.get('[data-testid="data-display"]').should('contain', 'test data');
    });

    it('should handle 401 unauthorized responses', () => {
      cy.intercept('GET', '/api/protected-data', {
        statusCode: 401,
        body: {
          error: 'Unauthorized',
        },
      }).as('unauthorizedRequest');

      cy.visit('/protected-data-page');
      cy.wait('@unauthorizedRequest');

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.window().its('localStorage.token').should('not.exist');
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '/api/data', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/data-page');
      cy.wait('@networkError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and(
          'contain',
          'Network error. Please check your connection and try again.'
        );
    });

    it('should handle server errors', () => {
      cy.intercept('GET', '/api/data', {
        statusCode: 500,
        body: {
          error: 'Internal server error',
        },
      }).as('serverError');

      cy.visit('/data-page');
      cy.wait('@serverError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Internal server error');
    });
  });

  describe('Request Configuration', () => {
    it('should include correct headers', () => {
      cy.intercept('POST', '/api/data', req => {
        expect(req.headers['content-type']).to.equal('application/json');
        expect(req.headers['accept']).to.equal('application/json');
        req.reply({
          statusCode: 200,
          body: { success: true },
        });
      }).as('headersCheck');

      cy.visit('/data-form');
      cy.get('[data-testid="submit-data"]').click();
      cy.wait('@headersCheck');
    });

    it('should handle request timeouts', () => {
      cy.intercept('GET', '/api/slow-data', req => {
        req.delay(11000).reply({
          statusCode: 200,
          body: { data: 'slow response' },
        });
      }).as('timeoutRequest');

      cy.visit('/slow-data-page');
      cy.wait('@timeoutRequest');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Request timed out');
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed requests', () => {
      let attempts = 0;
      cy.intercept('GET', '/api/flaky-data', req => {
        attempts++;
        if (attempts === 1) {
          req.reply({
            statusCode: 500,
            body: { error: 'Temporary error' },
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { data: 'success after retry' },
          });
        }
      }).as('retryRequest');

      cy.visit('/flaky-data-page');
      cy.wait('@retryRequest');
      cy.wait('@retryRequest');

      cy.get('[data-testid="data-display"]').should(
        'contain',
        'success after retry'
      );
    });

    it('should handle session recovery after token expiration', () => {
      // First request with expired token
      cy.intercept('GET', '/api/protected-data', {
        statusCode: 401,
        body: {
          error: 'Token expired',
        },
      }).as('expiredToken');

      // Refresh token request
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          token: 'new-token',
        },
      }).as('tokenRefresh');

      // Retry with new token
      cy.intercept('GET', '/api/protected-data', {
        statusCode: 200,
        body: {
          data: 'protected data',
        },
      }).as('retryWithNewToken');

      cy.visit('/protected-data-page');
      cy.wait('@expiredToken');
      cy.wait('@tokenRefresh');
      cy.wait('@retryWithNewToken');

      cy.get('[data-testid="data-display"]').should(
        'contain',
        'protected data'
      );
    });
  });
});
