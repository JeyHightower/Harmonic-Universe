describe('Authentication and User Management', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        user: { id: 1, username: 'newuser' },
        token: 'fake-jwt-token',
      },
    }).as('registerRequest');
  });

  describe('Authentication', () => {
    it('should handle user registration', () => {
      cy.visit('/register');

      // Fill registration form
      cy.get('[data-testid="register-username"]').type('newuser');
      cy.get('[data-testid="register-email"]').type('newuser@example.com');
      cy.get('[data-testid="register-password"]').type('password123');
      cy.get('[data-testid="register-confirm-password"]').type('password123');
      cy.get('[data-testid="register-submit"]').click();

      cy.wait('@registerRequest');
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', 'newuser');
    });

    it('should handle login', () => {
      cy.visit('/login');

      // Fill login form
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
    });

    it('should handle password reset', () => {
      // Mock password reset request
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          message: 'Password reset email sent',
        },
      }).as('resetRequest');

      cy.visit('/reset-password');

      // Request password reset
      cy.get('[data-testid="reset-email"]').type('test@example.com');
      cy.get('[data-testid="reset-submit"]').click();
      cy.wait('@resetRequest');

      // Verify success message
      cy.get('[data-testid="reset-success"]').should('be.visible');
    });

    it('should handle logout', () => {
      // Mock logout request
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
      }).as('logoutRequest');

      // Login first
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      // Perform logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      cy.wait('@logoutRequest');

      // Verify redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      // Mock profile data
      cy.intercept('GET', '/api/users/1/profile', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          avatar: 'https://example.com/avatar.jpg',
          preferences: {
            theme: 'light',
            notifications: {
              email: true,
              push: true,
            },
          },
        },
      }).as('getProfile');

      // Login and visit profile
      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@loginRequest');

      cy.visit('/profile');
      cy.wait('@getProfile');
    });

    it('should update profile information', () => {
      // Mock profile update
      cy.intercept('PUT', '/api/users/1/profile', {
        statusCode: 200,
        body: {
          username: 'updateduser',
          email: 'updated@example.com',
        },
      }).as('updateProfile');

      // Update profile
      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="profile-username"]').clear().type('updateduser');
      cy.get('[data-testid="profile-email"]')
        .clear()
        .type('updated@example.com');
      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@updateProfile');

      // Verify updates
      cy.get('[data-testid="profile-username"]').should(
        'have.value',
        'updateduser'
      );
      cy.get('[data-testid="profile-email"]').should(
        'have.value',
        'updated@example.com'
      );
    });

    it('should handle avatar upload', () => {
      // Mock avatar upload
      cy.intercept('POST', '/api/users/1/avatar', {
        statusCode: 200,
        body: {
          avatar: 'https://example.com/new-avatar.jpg',
        },
      }).as('uploadAvatar');

      // Upload avatar
      cy.get('[data-testid="avatar-upload"]').attachFile({
        fileContent: 'test image content',
        fileName: 'avatar.jpg',
        mimeType: 'image/jpeg',
      });
      cy.wait('@uploadAvatar');

      // Verify avatar update
      cy.get('[data-testid="user-avatar"]')
        .should('have.attr', 'src')
        .and('include', 'new-avatar.jpg');
    });

    it('should manage user preferences', () => {
      // Mock preferences update
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          theme: 'dark',
          notifications: {
            email: false,
            push: true,
          },
        },
      }).as('updatePreferences');

      // Update preferences
      cy.get('[data-testid="preferences-tab"]').click();
      cy.get('[data-testid="theme-selector"]').select('dark');
      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updatePreferences');

      // Verify updates
      cy.get('[data-testid="theme-selector"]').should('have.value', 'dark');
      cy.get('[data-testid="email-notifications"]').should('not.be.checked');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid login', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid credentials',
        },
      }).as('failedLogin');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('wrong@example.com');
      cy.get('[data-testid="login-password"]').type('wrongpassword');
      cy.get('[data-testid="login-submit"]').click();
      cy.wait('@failedLogin');

      cy.get('[data-testid="login-error"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });

    it('should handle registration validation', () => {
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 400,
        body: {
          error: 'Email already exists',
        },
      }).as('failedRegister');

      cy.visit('/register');
      cy.get('[data-testid="register-username"]').type('existinguser');
      cy.get('[data-testid="register-email"]').type('existing@example.com');
      cy.get('[data-testid="register-password"]').type('password123');
      cy.get('[data-testid="register-confirm-password"]').type('password123');
      cy.get('[data-testid="register-submit"]').click();
      cy.wait('@failedRegister');

      cy.get('[data-testid="register-error"]')
        .should('be.visible')
        .and('contain', 'Email already exists');
    });

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
  });
});
