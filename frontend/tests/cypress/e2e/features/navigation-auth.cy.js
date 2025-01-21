describe('Navigation & Authentication Features', () => {
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
          user: { id: 1, username: 'newuser' },
          token: 'fake-jwt-token',
        },
      }).as('registerRequest');

      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('logoutRequest');
    });

    it('should register new user', () => {
      cy.visit('/register');

      cy.get('[data-testid="register-username"]').type('newuser');
      cy.get('[data-testid="register-email"]').type('newuser@example.com');
      cy.get('[data-testid="register-password"]').type('password123');
      cy.get('[data-testid="register-confirm"]').type('password123');
      cy.get('[data-testid="register-submit"]').click();

      cy.wait('@registerRequest');
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', 'newuser');
    });

    it('should validate registration fields', () => {
      cy.visit('/register');

      cy.get('[data-testid="register-submit"]').click();

      cy.get('[data-testid="username-error"]')
        .should('be.visible')
        .and('contain', 'Username is required');
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', 'Email is required');
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', 'Password is required');
    });

    it('should login user', () => {
      cy.visit('/login');

      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', 'testuser');
    });

    it('should handle invalid login', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid credentials',
        },
      }).as('invalidLogin');

      cy.visit('/login');

      cy.get('[data-testid="login-email"]').type('wrong@example.com');
      cy.get('[data-testid="login-password"]').type('wrongpass');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@invalidLogin');
      cy.get('[data-testid="login-error"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });

    it('should logout user', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Then logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout"]').click();
      cy.wait('@logoutRequest');

      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
    });

    it('should handle password reset request', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Password reset email sent',
        },
      }).as('resetRequest');

      cy.visit('/forgot-password');

      cy.get('[data-testid="reset-email"]').type('test@example.com');
      cy.get('[data-testid="reset-submit"]').click();
      cy.wait('@resetRequest');

      cy.get('[data-testid="reset-success"]')
        .should('be.visible')
        .and('contain', 'Password reset email sent');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Login before navigation tests
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token',
        },
      }).as('loginRequest');

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

      // Settings
      cy.get('[data-testid="nav-settings"]').click();
      cy.url().should('include', '/settings');
      cy.get('[data-testid="settings-title"]').should('be.visible');
    });

    it('should show mobile menu', () => {
      cy.viewport('iphone-x');

      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');

      cy.get('[data-testid="mobile-nav-universes"]').click();
      cy.url().should('include', '/universes');
    });

    it('should handle breadcrumb navigation', () => {
      // Navigate to a deep path
      cy.visit('/universes/1/edit');

      cy.get('[data-testid="breadcrumb"]').within(() => {
        cy.contains('Universes').click();
      });

      cy.url().should('include', '/universes');
    });

    it('should protect routes', () => {
      // Logout first
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout"]').click();

      // Try accessing protected route
      cy.visit('/universes');
      cy.url().should('include', '/login');
      cy.get('[data-testid="auth-required"]')
        .should('be.visible')
        .and('contain', 'Please login to continue');
    });

    it('should handle 404 routes', () => {
      cy.visit('/non-existent-page');

      cy.get('[data-testid="not-found"]')
        .should('be.visible')
        .and('contain', 'Page not found');
    });
  });

  describe('Search & Navigation', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/search?q=*', {
        statusCode: 200,
        body: {
          results: [
            { id: 1, type: 'universe', name: 'Test Universe' },
            { id: 2, type: 'template', name: 'Test Template' },
          ],
        },
      }).as('searchRequest');
    });

    it('should search from navigation bar', () => {
      cy.get('[data-testid="nav-search"]').click();
      cy.get('[data-testid="search-input"]').type('test');
      cy.wait('@searchRequest');

      cy.get('[data-testid="search-results"]').within(() => {
        cy.contains('Test Universe').should('be.visible');
        cy.contains('Test Template').should('be.visible');
      });
    });

    it('should navigate to search result', () => {
      cy.get('[data-testid="nav-search"]').click();
      cy.get('[data-testid="search-input"]').type('test');
      cy.wait('@searchRequest');

      cy.get('[data-testid="search-results"]')
        .contains('Test Universe')
        .click();

      cy.url().should('include', '/universes/1');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      cy.intercept('POST', '/api/auth/login', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      cy.get('[data-testid="network-error"]')
        .should('be.visible')
        .and('contain', 'Network error');
    });

    it('should handle server errors', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: {
          error: 'Internal server error',
        },
      }).as('serverError');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      cy.get('[data-testid="server-error"]')
        .should('be.visible')
        .and('contain', 'Internal server error');
    });

    it('should handle session expiration', () => {
      cy.intercept('GET', '/api/protected-route', {
        statusCode: 401,
        body: {
          error: 'Session expired',
        },
      }).as('sessionExpired');

      cy.visit('/protected-route');

      cy.get('[data-testid="session-expired"]')
        .should('be.visible')
        .and('contain', 'Session expired');
      cy.url().should('include', '/login');
    });
  });
});
