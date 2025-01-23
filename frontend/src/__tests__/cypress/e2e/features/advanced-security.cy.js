describe('Advanced Security Features', () => {
  beforeEach(() => {
    // Clear cookies and local storage
    cy.clearCookies();
    cy.clearLocalStorage();

    // Mock auth endpoints
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.intercept('POST', '/api/auth/refresh', {
      statusCode: 200,
      body: {
        token: 'new-fake-jwt-token',
      },
    }).as('refreshToken');
  });

  describe('Token Management', () => {
    it('should handle token refresh flow', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Mock expired token response
      cy.intercept('GET', '/api/universes', {
        statusCode: 401,
        body: {
          error: 'Token expired',
        },
      }).as('expiredToken');

      // Mock successful request with new token
      cy.intercept('GET', '/api/universes', {
        statusCode: 200,
        body: {
          universes: [],
        },
      }).as('validRequest');

      // Visit protected route
      cy.visit('/universes');

      // Should attempt refresh
      cy.wait('@expiredToken');
      cy.wait('@refreshToken');
      cy.wait('@validRequest');

      // Verify new token is stored
      cy.window().its('localStorage.token').should('exist');
    });

    it('should handle token refresh failure', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Mock expired token
      cy.intercept('GET', '/api/universes', {
        statusCode: 401,
        body: {
          error: 'Token expired',
        },
      }).as('expiredToken');

      // Mock failed refresh
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 401,
        body: {
          error: 'Invalid refresh token',
        },
      }).as('failedRefresh');

      // Visit protected route
      cy.visit('/universes');

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="session-expired"]').should('be.visible');
    });
  });

  describe('Concurrent Sessions', () => {
    it('should handle session invalidation', () => {
      // Login on "first device"
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Mock login from another device
      cy.intercept('GET', '/api/auth/check-session', {
        statusCode: 401,
        body: {
          error: 'Session invalidated',
          reason: 'logged_in_elsewhere',
        },
      }).as('sessionCheck');

      // Perform action
      cy.visit('/universes');

      // Should show session invalidated message
      cy.get('[data-testid="session-invalidated"]')
        .should('be.visible')
        .and('contain', 'Logged in on another device');

      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should handle max sessions limit', () => {
      // Mock max sessions reached
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 400,
        body: {
          error: 'Max sessions reached',
          active_sessions: [
            {
              device: 'Chrome on Windows',
              last_active: '2024-01-20T10:00:00Z',
            },
            { device: 'Safari on iPhone', last_active: '2024-01-20T11:00:00Z' },
          ],
        },
      }).as('maxSessions');

      // Attempt login
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      // Should show max sessions dialog
      cy.get('[data-testid="max-sessions-dialog"]').should('be.visible');
      cy.get('[data-testid="active-sessions-list"]').should(
        'contain',
        'Chrome on Windows'
      );
    });
  });

  describe('Password Security', () => {
    it('should enforce password history', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Mock password history check
      cy.intercept('POST', '/api/auth/change-password', {
        statusCode: 400,
        body: {
          error: 'Password previously used',
          message: 'Cannot reuse any of your last 5 passwords',
        },
      }).as('passwordHistory');

      // Try to change password
      cy.visit('/settings/security');
      cy.get('[data-testid="current-password"]').type('password123');
      cy.get('[data-testid="new-password"]').type('oldpassword123');
      cy.get('[data-testid="change-password-submit"]').click();

      // Should show error message
      cy.get('[data-testid="password-history-error"]')
        .should('be.visible')
        .and('contain', 'Cannot reuse any of your last 5 passwords');
    });

    it('should handle password complexity requirements', () => {
      cy.visit('/register');

      const testCases = [
        {
          password: 'short',
          error: 'Password must be at least 8 characters',
        },
        {
          password: 'onlylowercase',
          error: 'Password must include uppercase letters',
        },
        {
          password: 'ONLYUPPERCASE',
          error: 'Password must include lowercase letters',
        },
        {
          password: 'NoNumbers',
          error: 'Password must include numbers',
        },
        {
          password: 'NoSpecial123',
          error: 'Password must include special characters',
        },
      ];

      testCases.forEach(({ password, error }) => {
        cy.get('[data-testid="register-password"]').clear().type(password);
        cy.get('[data-testid="password-requirements"]').should(
          'contain',
          error
        );
        cy.get('[data-testid="register-submit"]').should('be.disabled');
      });

      // Test valid password
      cy.get('[data-testid="register-password"]').clear().type('ValidP@ssw0rd');
      cy.get('[data-testid="password-requirements"]').should(
        'contain',
        'All requirements met'
      );
      cy.get('[data-testid="register-submit"]').should('not.be.disabled');
    });
  });

  describe('Account Recovery', () => {
    it('should handle password reset flow', () => {
      // Mock reset token verification
      cy.intercept('GET', '/api/auth/verify-reset-token*', {
        statusCode: 200,
        body: {
          valid: true,
          email: 'test@example.com',
        },
      }).as('verifyToken');

      // Mock password reset
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('resetPassword');

      // Visit reset page with token
      cy.visit('/reset-password?token=valid-token');
      cy.wait('@verifyToken');

      // Enter new password
      cy.get('[data-testid="new-password"]').type('NewP@ssw0rd123');
      cy.get('[data-testid="confirm-password"]').type('NewP@ssw0rd123');
      cy.get('[data-testid="reset-password-submit"]').click();

      // Should reset successfully
      cy.wait('@resetPassword');
      cy.get('[data-testid="reset-success"]').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('should handle invalid reset tokens', () => {
      // Mock invalid token
      cy.intercept('GET', '/api/auth/verify-reset-token*', {
        statusCode: 400,
        body: {
          valid: false,
          error: 'Token expired or invalid',
        },
      }).as('invalidToken');

      // Visit reset page with invalid token
      cy.visit('/reset-password?token=invalid-token');
      cy.wait('@invalidToken');

      // Should show error message
      cy.get('[data-testid="invalid-token-error"]')
        .should('be.visible')
        .and('contain', 'This password reset link has expired or is invalid');

      // Should not show reset form
      cy.get('[data-testid="reset-password-form"]').should('not.exist');
    });
  });

  describe('Security Events', () => {
    it('should track and notify about security events', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Mock security events
      cy.intercept('GET', '/api/auth/security-events', {
        statusCode: 200,
        body: {
          events: [
            {
              type: 'new_login',
              device: 'Unknown Device',
              location: 'New Location',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      }).as('securityEvents');

      // Visit security settings
      cy.visit('/settings/security');

      // Should show security notification
      cy.get('[data-testid="security-notification"]')
        .should('be.visible')
        .and('contain', 'New login from Unknown Device');

      // Should list security event
      cy.get('[data-testid="security-events-list"]')
        .should('contain', 'Unknown Device')
        .and('contain', 'New Location');
    });

    it('should handle suspicious activity detection', () => {
      // Mock suspicious activity
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 403,
        body: {
          error: 'Suspicious activity detected',
          verification_required: true,
          verification_method: 'email',
        },
      }).as('suspiciousLogin');

      // Attempt login
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      // Should show verification required
      cy.get('[data-testid="verification-required"]')
        .should('be.visible')
        .and('contain', 'Verify your identity');

      // Should show verification method
      cy.get('[data-testid="verification-method-email"]').should('be.visible');
    });
  });
});
