describe('Error Handling', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');
  });

  describe('Error Boundaries', () => {
    it('should handle component errors', () => {
      // Visit a route with a component that will throw an error
      cy.visit('/error-test');

      // Verify error boundary caught the error
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.contains('Something went wrong').should('be.visible');

      // Test retry functionality
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="error-boundary"]').should('not.exist');
    });

    it('should handle critical errors', () => {
      // Simulate a critical error (multiple errors)
      cy.window().then(win => {
        for (let i = 0; i < 4; i++) {
          win.dispatchEvent(
            new ErrorEvent('error', {
              error: new Error('Critical error'),
              message: 'Critical error',
            })
          );
        }
      });

      // Verify critical error UI
      cy.get('[data-testid="error-boundary"]')
        .should('be.visible')
        .and('contain', 'Critical Error');

      // Verify retry button is not shown for critical errors
      cy.get('[data-testid="retry-button"]').should('not.exist');

      // Verify reset button is shown
      cy.get('[data-testid="reset-button"]').should('be.visible');
    });

    it('should handle memory errors', () => {
      // Simulate a memory error
      cy.window().then(win => {
        win.dispatchEvent(
          new ErrorEvent('error', {
            error: new Error('Out of memory'),
            message: 'Out of memory',
          })
        );
      });

      // Verify critical error UI
      cy.get('[data-testid="error-boundary"]')
        .should('be.visible')
        .and('contain', 'Critical Error');

      // Verify technical details are shown when enabled
      cy.get('[data-testid="error-details"]')
        .should('be.visible')
        .and('contain', 'Out of memory');
    });
  });

  describe('API Error Handling', () => {
    it('should handle 400 Bad Request errors', () => {
      // Mock a 400 error response
      cy.intercept('POST', '/api/universes', {
        statusCode: 400,
        body: {
          message: 'Invalid universe parameters',
        },
      }).as('createUniverse');

      // Attempt to create a universe with invalid data
      cy.visit('/universes/create');
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid universe parameters');
    });

    it('should handle 401 Unauthorized errors', () => {
      // Mock a 401 error response
      cy.intercept('GET', '/api/universes/*', {
        statusCode: 401,
        body: {
          message: 'Unauthorized access',
        },
      }).as('getUniverse');

      // Attempt to access a protected route
      cy.visit('/universes/1');

      // Verify redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Please log in to continue');
    });

    it('should handle 403 Forbidden errors', () => {
      // Mock a 403 error response
      cy.intercept('PUT', '/api/universes/*', {
        statusCode: 403,
        body: {
          message: 'Insufficient permissions',
        },
      }).as('updateUniverse');

      // Attempt to update a universe without permissions
      cy.visit('/universes/1/edit');
      cy.get('[data-testid="save-changes"]').click();

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'You do not have permission to perform this action');
    });

    it('should handle 404 Not Found errors', () => {
      // Mock a 404 error response
      cy.intercept('GET', '/api/universes/*', {
        statusCode: 404,
        body: {
          message: 'Universe not found',
        },
      }).as('getUniverse');

      // Attempt to access a non-existent universe
      cy.visit('/universes/999');

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'The requested resource was not found');
    });

    it('should handle 429 Rate Limit errors', () => {
      // Mock a 429 error response
      cy.intercept('POST', '/api/comments', {
        statusCode: 429,
        body: {
          message: 'Too many requests',
        },
      }).as('createComment');

      // Attempt to create multiple comments rapidly
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="comment-input"]').type(
          `Test comment ${i}{enter}`
        );
      }

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Too many requests. Please try again later');
    });

    it('should handle 500 Server errors', () => {
      // Mock a 500 error response
      cy.intercept('GET', '/api/universes', {
        statusCode: 500,
        body: {
          message: 'Internal server error',
        },
      }).as('getUniverses');

      // Attempt to load universes
      cy.visit('/universes');

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Something went wrong on our end');

      // Verify retry button
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle network errors', () => {
      // Mock a network error
      cy.intercept('GET', '/api/universes', {
        forceNetworkError: true,
      }).as('getUniverses');

      // Attempt to load universes
      cy.visit('/universes');

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Unable to connect to the server');

      // Verify retry button
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Form Validation Errors', () => {
    it('should handle required field errors', () => {
      cy.visit('/universes/create');

      // Submit form without required fields
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify validation errors
      cy.get('[data-testid="name-error"]')
        .should('be.visible')
        .and('contain', 'Name is required');
      cy.get('[data-testid="description-error"]')
        .should('be.visible')
        .and('contain', 'Description is required');
    });

    it('should handle invalid input errors', () => {
      cy.visit('/universes/create');

      // Enter invalid data
      cy.get('[data-testid="universe-name"]').type('a'); // Too short
      cy.get('[data-testid="max-participants"]').type('-1'); // Invalid number
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify validation errors
      cy.get('[data-testid="name-error"]')
        .should('be.visible')
        .and('contain', 'Name must be at least 3 characters');
      cy.get('[data-testid="max-participants-error"]')
        .should('be.visible')
        .and('contain', 'Must be a positive number');
    });

    it('should handle file upload errors', () => {
      cy.visit('/profile');

      // Attempt to upload invalid file type
      cy.get('[data-testid="avatar-upload"]').attachFile('invalid.txt');

      // Verify error message
      cy.get('[data-testid="upload-error"]')
        .should('be.visible')
        .and('contain', 'Invalid file type');

      // Attempt to upload file that's too large
      const largeFile = Cypress.Buffer.alloc(5 * 1024 * 1024); // 5MB file
      cy.get('[data-testid="avatar-upload"]').attachFile({
        fileContent: largeFile,
        fileName: 'large.jpg',
        mimeType: 'image/jpeg',
      });

      // Verify error message
      cy.get('[data-testid="upload-error"]')
        .should('be.visible')
        .and('contain', 'File size must be less than 2MB');
    });
  });

  describe('WebSocket Error Handling', () => {
    it('should handle connection errors', () => {
      // Mock WebSocket connection error
      cy.intercept('GET', '/socket.io/*', {
        statusCode: 500,
        body: {
          message: 'Failed to establish WebSocket connection',
        },
      }).as('socketConnection');

      // Visit a page that requires WebSocket
      cy.visit('/universe/1/edit');

      // Verify error message
      cy.get('[data-testid="connection-error"]')
        .should('be.visible')
        .and('contain', 'Failed to connect to collaboration server');

      // Verify retry button
      cy.get('[data-testid="retry-connection"]').should('be.visible');
    });

    it('should handle reconnection', () => {
      // Visit a page that requires WebSocket
      cy.visit('/universe/1/edit');

      // Simulate connection loss
      cy.window().then(win => {
        win.socketClient.disconnect();
      });

      // Verify disconnected state
      cy.get('[data-testid="connection-status"]')
        .should('contain', 'Disconnected')
        .and('have.class', 'disconnected');

      // Simulate successful reconnection
      cy.window().then(win => {
        win.socketClient.connect();
      });

      // Verify reconnected state
      cy.get('[data-testid="connection-status"]')
        .should('contain', 'Connected')
        .and('have.class', 'connected');
    });

    it('should handle message delivery errors', () => {
      // Visit a page that requires WebSocket
      cy.visit('/universe/1/edit');

      // Mock message delivery failure
      cy.window().then(win => {
        win.socketClient.emit('error', {
          type: 'message_delivery',
          message: 'Failed to deliver message',
        });
      });

      // Verify error message
      cy.get('[data-testid="message-error"]')
        .should('be.visible')
        .and('contain', 'Failed to deliver message');

      // Verify retry option
      cy.get('[data-testid="retry-message"]').should('be.visible');
    });
  });
});
