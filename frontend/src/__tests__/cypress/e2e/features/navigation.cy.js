describe('Navigation and Authentication', () => {
  describe('Authentication', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token',
        },
      }).as('loginRequest');

      cy.intercept('POST', '/api/auth/register', {
        statusCode: 200,
        body: {
          user: { id: 2, username: 'newuser' },
          token: 'fake-jwt-token',
        },
      }).as('registerRequest');
    });

    it('should handle registration', () => {
      cy.visit('/register');
      cy.get('[data-testid="register-username"]').type('newuser');
      cy.get('[data-testid="register-email"]').type('new@example.com');
      cy.get('[data-testid="register-password"]').type('password123');
      cy.get('[data-testid="register-confirm"]').type('password123');
      cy.get('[data-testid="register-submit"]').click();
      cy.wait('@registerRequest');

      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', 'newuser');
    });

    it('should handle login', () => {
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      cy.url().should('include', '/dashboard');
    });

    it('should handle password reset', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          message: 'Password reset email sent',
        },
      }).as('resetRequest');

      cy.visit('/reset-password');
      cy.get('[data-testid="reset-email"]').type('test@example.com');
      cy.get('[data-testid="reset-submit"]').click();
      cy.wait('@resetRequest');

      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Password reset email sent');
    });

    it('should handle logout', () => {
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
      }).as('logoutRequest');

      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Then logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      cy.wait('@logoutRequest');

      cy.url().should('include', '/login');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Mock authentication
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token',
        },
      }).as('loginRequest');

      // Login
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should navigate through main menu', () => {
      // Dashboard
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-title"]').should('be.visible');

      // Universes
      cy.get('[data-testid="nav-universes"]').click();
      cy.url().should('include', '/universes');
      cy.get('[data-testid="universes-title"]').should('be.visible');

      // Templates
      cy.get('[data-testid="nav-templates"]').click();
      cy.url().should('include', '/templates');
      cy.get('[data-testid="templates-title"]').should('be.visible');
    });

    it('should handle breadcrumb navigation', () => {
      cy.visit('/universes/1/edit');

      cy.get('[data-testid="breadcrumb"]').within(() => {
        cy.contains('Universes').click();
      });

      cy.url().should('include', '/universes');
    });

    it('should handle mobile navigation', () => {
      cy.viewport('iphone-x');

      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-nav"]').should('be.visible');

      // Navigate
      cy.get('[data-testid="mobile-nav-universes"]').click();
      cy.url().should('include', '/universes');

      // Close menu
      cy.get('[data-testid="mobile-menu-close"]').click();
      cy.get('[data-testid="mobile-nav"]').should('not.be.visible');
    });
  });

  describe('Route Protection', () => {
    it('should redirect unauthenticated users', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should handle role-based access', () => {
      // Mock admin check
      cy.intercept('GET', '/api/auth/user', {
        statusCode: 200,
        body: {
          roles: ['user'],
        },
      }).as('roleCheck');

      // Try accessing admin route
      cy.visit('/admin');
      cy.wait('@roleCheck');

      cy.url().should('include', '/unauthorized');
    });

    it('should handle expired sessions', () => {
      cy.intercept('GET', '/api/protected-route', {
        statusCode: 401,
        body: {
          error: 'Token expired',
        },
      }).as('expiredSession');

      cy.visit('/protected-route');
      cy.wait('@expiredSession');

      cy.url().should('include', '/login');
      cy.get('[data-testid="session-expired"]').should('be.visible');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          results: [
            { id: 1, type: 'universe', name: 'Test Universe' },
            { id: 2, type: 'template', name: 'Test Template' },
          ],
        },
      }).as('searchRequest');
    });

    it('should handle global search', () => {
      cy.get('[data-testid="global-search"]').type('test{enter}');
      cy.wait('@searchRequest');

      cy.get('[data-testid="search-results"]').within(() => {
        cy.contains('Test Universe').should('be.visible');
        cy.contains('Test Template').should('be.visible');
      });
    });

    it('should handle filters', () => {
      cy.intercept('GET', '/api/search?type=universe', {
        statusCode: 200,
        body: {
          results: [{ id: 1, type: 'universe', name: 'Test Universe' }],
        },
      }).as('filteredSearch');

      cy.get('[data-testid="search-type"]').select('universe');
      cy.wait('@filteredSearch');

      cy.get('[data-testid="search-results"]').within(() => {
        cy.contains('Test Universe').should('be.visible');
        cy.contains('Test Template').should('not.exist');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors', () => {
      cy.visit('/invalid-route');
      cy.get('[data-testid="404-page"]').should('be.visible');
    });

    it('should handle auth errors', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid credentials',
        },
      }).as('loginError');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('wrong@example.com');
      cy.get('[data-testid="login-password"]').type('wrongpass');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '/api/protected-route', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/protected-route');
      cy.wait('@networkError');

      cy.get('[data-testid="network-error"]')
        .should('be.visible')
        .and('contain', 'Network error');
    });
  });
});
