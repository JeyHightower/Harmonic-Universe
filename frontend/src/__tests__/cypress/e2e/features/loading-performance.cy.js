describe('Loading States and Performance', () => {
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

  describe('Loading States', () => {
    it('should show loading spinner during data fetch', () => {
      // Mock a delayed response
      cy.intercept('GET', '/api/universes', req => {
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: {
            universes: [],
          },
        });
      }).as('getUniverses');

      cy.visit('/universes');

      // Verify loading spinner is shown
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="loading-text"]')
        .should('be.visible')
        .and('contain', 'Loading...');

      // Wait for data and verify spinner is hidden
      cy.wait('@getUniverses');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should show loading state during form submission', () => {
      cy.visit('/universes/create');

      // Fill form
      cy.get('[data-testid="universe-name"]').type('Test Universe');
      cy.get('[data-testid="universe-description"]').type('Test Description');

      // Mock delayed response
      cy.intercept('POST', '/api/universes', {
        delay: 1000,
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test Universe',
        },
      }).as('createUniverse');

      // Submit form
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify loading state
      cy.get('[data-testid="submit-button-loading"]').should('be.visible');
      cy.get('[data-testid="create-universe-submit"]').should('be.disabled');

      // Wait for response
      cy.wait('@createUniverse');
      cy.get('[data-testid="submit-button-loading"]').should('not.exist');
    });

    it('should handle loading errors gracefully', () => {
      // Mock error response
      cy.intercept('GET', '/api/universes', {
        delay: 1000,
        statusCode: 500,
        body: {
          error: 'Internal server error',
        },
      }).as('getUniversesError');

      cy.visit('/universes');

      // Verify loading spinner is shown
      cy.get('[data-testid="loading-spinner"]').should('be.visible');

      // Wait for error response
      cy.wait('@getUniversesError');

      // Verify error state
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Something went wrong');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Lazy Loading', () => {
    it('should lazy load components', () => {
      // Mock component chunks
      cy.intercept('GET', '**/UniverseCreate.*.js').as('loadComponent');

      // Navigate to route with lazy-loaded component
      cy.visit('/universes/create');

      // Verify loading indicator during component load
      cy.get('[data-testid="loading-spinner"]').should('be.visible');

      // Wait for component to load
      cy.wait('@loadComponent');
      cy.get('[data-testid="create-universe-form"]').should('be.visible');
    });

    it('should handle lazy loading errors', () => {
      // Mock chunk loading error
      cy.intercept('GET', '**/UniverseCreate.*.js', {
        statusCode: 404,
      }).as('loadComponentError');

      // Navigate to route with lazy-loaded component
      cy.visit('/universes/create');

      // Verify error state
      cy.get('[data-testid="chunk-error"]')
        .should('be.visible')
        .and('contain', 'Failed to load component');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should lazy load images', () => {
      // Mock image response
      cy.intercept('GET', '**/*.{png,jpg,jpeg}', req => {
        req.reply({
          delay: 1000,
          fixture: 'test-image.jpg',
        });
      }).as('loadImage');

      cy.visit('/profile');

      // Verify placeholder is shown
      cy.get('[data-testid="profile-image"]')
        .should('have.attr', 'src')
        .and('include', 'placeholder.jpg');

      // Wait for image to load
      cy.wait('@loadImage');

      // Verify actual image is shown
      cy.get('[data-testid="profile-image"]')
        .should('have.attr', 'src')
        .and('include', 'test-image.jpg');
    });
  });

  describe('Performance', () => {
    it('should handle infinite scroll efficiently', () => {
      // Mock paginated data
      let page = 1;
      cy.intercept('GET', '/api/universes*', req => {
        req.reply({
          statusCode: 200,
          body: {
            universes: Array.from({ length: 10 }, (_, i) => ({
              id: (page - 1) * 10 + i + 1,
              name: `Universe ${(page - 1) * 10 + i + 1}`,
            })),
            hasMore: page < 3,
          },
        });
        page++;
      }).as('getUniverses');

      cy.visit('/universes');

      // Initial load
      cy.wait('@getUniverses');
      cy.get('[data-testid="universe-card"]').should('have.length', 10);

      // Scroll to bottom
      cy.scrollTo('bottom');

      // Wait for next page
      cy.wait('@getUniverses');
      cy.get('[data-testid="universe-card"]').should('have.length', 20);

      // Scroll to bottom again
      cy.scrollTo('bottom');

      // Wait for final page
      cy.wait('@getUniverses');
      cy.get('[data-testid="universe-card"]').should('have.length', 30);

      // Verify no more loading indicator
      cy.get('[data-testid="loading-more"]').should('not.exist');
    });

    it('should debounce search input', () => {
      // Mock search API
      cy.intercept('GET', '/api/universes/search*').as('searchUniverses');

      cy.visit('/universes');

      // Type search term quickly
      cy.get('[data-testid="search-input"]').type('test universe');

      // Verify only one API call is made after debounce
      cy.get('@searchUniverses.all').should('have.length', 1);
    });

    it('should cache and reuse data', () => {
      // Mock universe data
      cy.intercept('GET', '/api/universes/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test Universe',
        },
      }).as('getUniverse');

      // Visit universe page
      cy.visit('/universes/1');
      cy.wait('@getUniverse');

      // Navigate away
      cy.visit('/universes');

      // Navigate back
      cy.visit('/universes/1');

      // Verify no additional API call is made
      cy.get('@getUniverse.all').should('have.length', 1);
    });
  });

  describe('Loading Error Recovery', () => {
    it('should retry failed requests', () => {
      // Mock failed request followed by success
      let attempts = 0;
      cy.intercept('GET', '/api/universes', req => {
        attempts++;
        if (attempts === 1) {
          req.reply({
            statusCode: 500,
            body: {
              error: 'Internal server error',
            },
          });
        } else {
          req.reply({
            statusCode: 200,
            body: {
              universes: [],
            },
          });
        }
      }).as('getUniverses');

      cy.visit('/universes');

      // Wait for first attempt to fail
      cy.wait('@getUniverses');
      cy.get('[data-testid="error-message"]').should('be.visible');

      // Click retry
      cy.get('[data-testid="retry-button"]').click();

      // Verify successful retry
      cy.wait('@getUniverses');
      cy.get('[data-testid="universe-list"]').should('be.visible');
    });

    it('should handle offline/online transitions', () => {
      // Mock offline state
      cy.window().then(win => {
        cy.stub(win.navigator.connection, 'onchange').as('connectionChange');
        win.dispatchEvent(new Event('offline'));
      });

      // Verify offline message
      cy.get('[data-testid="offline-message"]')
        .should('be.visible')
        .and('contain', 'You are offline');

      // Mock online state
      cy.window().then(win => {
        win.dispatchEvent(new Event('online'));
      });

      // Verify reconnection
      cy.get('[data-testid="offline-message"]').should('not.exist');
      cy.get('[data-testid="online-message"]')
        .should('be.visible')
        .and('contain', 'Back online');
    });

    it('should handle session recovery', () => {
      // Mock session timeout
      cy.intercept('GET', '/api/universes', {
        statusCode: 401,
        body: {
          error: 'Session expired',
        },
      }).as('sessionExpired');

      // Mock successful reauth
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          token: 'new-token',
        },
      }).as('refreshToken');

      cy.visit('/universes');

      // Wait for session expired error
      cy.wait('@sessionExpired');

      // Verify automatic refresh attempt
      cy.wait('@refreshToken');

      // Verify recovery
      cy.get('[data-testid="universe-list"]').should('be.visible');
    });
  });
});
