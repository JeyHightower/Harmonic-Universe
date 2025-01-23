describe('Authentication Features', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.visit('/register');
    });

    it('should register a new user successfully', () => {
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 200,
        body: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          token: 'fake-jwt-token',
        },
      }).as('registerRequest');

      // Fill out registration form
      cy.get('[data-testid="register-username"]').type('testuser');
      cy.get('[data-testid="register-email"]').type('test@example.com');
      cy.get('[data-testid="register-password"]').type('Password123!');
      cy.get('[data-testid="register-confirm-password"]').type('Password123!');
      cy.get('[data-testid="register-submit"]').click();

      // Wait for registration request
      cy.wait('@registerRequest');

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Should show user info in header
      cy.get('[data-testid="user-menu"]').should('contain', 'testuser');

      // Should store token in localStorage
      cy.window().its('localStorage.token').should('exist');
    });

    it('should validate registration form fields', () => {
      // Try to submit empty form
      cy.get('[data-testid="register-submit"]').click();

      // Check validation messages
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

    it('should validate password requirements', () => {
      cy.get('[data-testid="register-username"]').type('testuser');
      cy.get('[data-testid="register-email"]').type('test@example.com');
      cy.get('[data-testid="register-password"]').type('weak');
      cy.get('[data-testid="register-confirm-password"]').type('weak');
      cy.get('[data-testid="register-submit"]').click();

      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', 'Password must be at least 8 characters');
    });

    it('should validate password confirmation match', () => {
      cy.get('[data-testid="register-username"]').type('testuser');
      cy.get('[data-testid="register-email"]').type('test@example.com');
      cy.get('[data-testid="register-password"]').type('Password123!');
      cy.get('[data-testid="register-confirm-password"]').type(
        'DifferentPass123!'
      );
      cy.get('[data-testid="register-submit"]').click();

      cy.get('[data-testid="confirm-password-error"]')
        .should('be.visible')
        .and('contain', 'Passwords do not match');
    });

    it('should handle registration errors', () => {
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 400,
        body: {
          error: 'Email already exists',
        },
      }).as('registerError');

      cy.get('[data-testid="register-username"]').type('testuser');
      cy.get('[data-testid="register-email"]').type('existing@example.com');
      cy.get('[data-testid="register-password"]').type('Password123!');
      cy.get('[data-testid="register-confirm-password"]').type('Password123!');
      cy.get('[data-testid="register-submit"]').click();

      cy.wait('@registerError');
      cy.get('[data-testid="register-error"]')
        .should('be.visible')
        .and('contain', 'Email already exists');
    });
  });

  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should login successfully', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          token: 'fake-jwt-token',
        },
      }).as('loginRequest');

      // Fill out login form
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('Password123!');
      cy.get('[data-testid="login-submit"]').click();

      // Wait for login request
      cy.wait('@loginRequest');

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Should show user info in header
      cy.get('[data-testid="user-menu"]').should('contain', 'testuser');

      // Should store token in localStorage
      cy.window().its('localStorage.token').should('exist');
    });

    it('should validate login form fields', () => {
      // Try to submit empty form
      cy.get('[data-testid="login-submit"]').click();

      // Check validation messages
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', 'Email is required');
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', 'Password is required');
    });

    it('should handle invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid email or password',
        },
      }).as('loginError');

      cy.get('[data-testid="login-email"]').type('wrong@example.com');
      cy.get('[data-testid="login-password"]').type('WrongPass123!');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginError');
      cy.get('[data-testid="login-error"]')
        .should('be.visible')
        .and('contain', 'Invalid email or password');
    });

    it('should handle server errors', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: {
          error: 'Internal server error',
        },
      }).as('loginServerError');

      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('Password123!');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginServerError');
      cy.get('[data-testid="login-error"]')
        .should('be.visible')
        .and('contain', 'Internal server error');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.login();
    });

    it('should logout successfully', () => {
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('logoutRequest');

      // Click logout button
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Wait for logout request
      cy.wait('@logoutRequest');

      // Should redirect to login page
      cy.url().should('include', '/login');

      // Should remove token from localStorage
      cy.window().its('localStorage.token').should('not.exist');

      // Should not show user menu
      cy.get('[data-testid="user-menu"]').should('not.exist');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route', () => {
      cy.visit('/dashboard');

      // Should redirect to login
      cy.url().should('include', '/login');

      // Should show message
      cy.get('[data-testid="auth-required"]')
        .should('be.visible')
        .and('contain', 'Please login to continue');
    });

    it('should maintain intended destination after login', () => {
      // Try to access protected route
      cy.visit('/dashboard');

      // Should redirect to login
      cy.url().should('include', '/login');

      // Login
      cy.login();

      // Should redirect back to intended destination
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: {
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

    it('should reset password with valid token', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          message: 'Password reset successful',
        },
      }).as('passwordReset');

      cy.visit('/reset-password?token=valid-token');

      cy.get('[data-testid="new-password"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-new-password"]').type('NewPassword123!');
      cy.get('[data-testid="reset-submit"]').click();

      cy.wait('@passwordReset');
      cy.url().should('include', '/login');
      cy.get('[data-testid="reset-success"]')
        .should('be.visible')
        .and('contain', 'Password reset successful');
    });

    it('should handle invalid reset token', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 400,
        body: {
          error: 'Invalid or expired reset token',
        },
      }).as('invalidReset');

      cy.visit('/reset-password?token=invalid-token');

      cy.get('[data-testid="new-password"]').type('NewPassword123!');
      cy.get('[data-testid="confirm-new-password"]').type('NewPassword123!');
      cy.get('[data-testid="reset-submit"]').click();

      cy.wait('@invalidReset');
      cy.get('[data-testid="reset-error"]')
        .should('be.visible')
        .and('contain', 'Invalid or expired reset token');
    });
  });
});
