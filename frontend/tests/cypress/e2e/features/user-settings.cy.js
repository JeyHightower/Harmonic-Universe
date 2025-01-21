describe('User Settings & Profile Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock user profile data
    cy.intercept('GET', '/api/users/1/profile', {
      statusCode: 200,
      body: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
          },
        },
      },
    }).as('getProfile');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/settings');
    cy.wait('@getProfile');
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.intercept('PUT', '/api/users/1/profile', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'updateduser',
          email: 'updated@example.com',
          bio: 'Updated bio',
        },
      }).as('updateProfile');
    });

    it('should display profile information', () => {
      cy.get('[data-testid="profile-section"]').within(() => {
        cy.get('[data-testid="username"]').should('have.value', 'testuser');
        cy.get('[data-testid="email"]').should(
          'have.value',
          'test@example.com'
        );
        cy.get('[data-testid="bio"]').should('have.value', 'Test bio');
      });
    });

    it('should update profile information', () => {
      cy.get('[data-testid="edit-profile"]').click();

      cy.get('[data-testid="username"]').clear().type('updateduser');
      cy.get('[data-testid="email"]').clear().type('updated@example.com');
      cy.get('[data-testid="bio"]').clear().type('Updated bio');

      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@updateProfile');

      cy.get('[data-testid="profile-success"]')
        .should('be.visible')
        .and('contain', 'Profile updated successfully');
    });

    it('should validate profile fields', () => {
      cy.get('[data-testid="edit-profile"]').click();

      cy.get('[data-testid="username"]').clear();
      cy.get('[data-testid="email"]').clear().type('invalid-email');

      cy.get('[data-testid="save-profile"]').click();

      cy.get('[data-testid="username-error"]')
        .should('be.visible')
        .and('contain', 'Username is required');
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', 'Invalid email format');
    });

    it('should update avatar', () => {
      cy.intercept('POST', '/api/users/1/avatar', {
        statusCode: 200,
        body: {
          avatar: 'https://example.com/new-avatar.jpg',
        },
      }).as('updateAvatar');

      const avatarFile = 'avatar.jpg';
      cy.get('[data-testid="avatar-upload"]').attachFile(avatarFile);
      cy.wait('@updateAvatar');

      cy.get('[data-testid="avatar-image"]')
        .should('have.attr', 'src')
        .and('include', 'new-avatar.jpg');
    });
  });

  describe('Security Settings', () => {
    it('should change password', () => {
      cy.intercept('PUT', '/api/users/1/password', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Password updated successfully',
        },
      }).as('updatePassword');

      cy.get('[data-testid="security-section"]').click();
      cy.get('[data-testid="current-password"]').type('password123');
      cy.get('[data-testid="new-password"]').type('newpassword123');
      cy.get('[data-testid="confirm-password"]').type('newpassword123');
      cy.get('[data-testid="update-password"]').click();
      cy.wait('@updatePassword');

      cy.get('[data-testid="password-success"]')
        .should('be.visible')
        .and('contain', 'Password updated successfully');
    });

    it('should enable two-factor authentication', () => {
      cy.intercept('POST', '/api/users/1/2fa/enable', {
        statusCode: 200,
        body: {
          qrCode: 'data:image/png;base64,fake-qr-code',
          secret: 'FAKE2FASECRET',
        },
      }).as('enable2FA');

      cy.intercept('POST', '/api/users/1/2fa/verify', {
        statusCode: 200,
        body: {
          success: true,
          message: '2FA enabled successfully',
        },
      }).as('verify2FA');

      cy.get('[data-testid="security-section"]').click();
      cy.get('[data-testid="enable-2fa"]').click();
      cy.wait('@enable2FA');

      cy.get('[data-testid="2fa-qr-code"]').should('be.visible');
      cy.get('[data-testid="2fa-code"]').type('123456');
      cy.get('[data-testid="verify-2fa"]').click();
      cy.wait('@verify2FA');

      cy.get('[data-testid="2fa-success"]')
        .should('be.visible')
        .and('contain', '2FA enabled successfully');
    });
  });

  describe('Notification Preferences', () => {
    beforeEach(() => {
      cy.intercept('PUT', '/api/users/1/notifications', {
        statusCode: 200,
        body: {
          email: false,
          push: true,
          collaboration: true,
          updates: false,
        },
      }).as('updateNotifications');
    });

    it('should update notification settings', () => {
      cy.get('[data-testid="notifications-section"]').click();

      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="push-notifications"]').check();
      cy.get('[data-testid="collaboration-notifications"]').check();
      cy.get('[data-testid="update-notifications"]').uncheck();

      cy.get('[data-testid="save-notifications"]').click();
      cy.wait('@updateNotifications');

      cy.get('[data-testid="notification-success"]')
        .should('be.visible')
        .and('contain', 'Notification preferences updated');
    });

    it('should test notification preview', () => {
      cy.intercept('POST', '/api/users/1/notifications/test', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Test notification sent',
        },
      }).as('testNotification');

      cy.get('[data-testid="notifications-section"]').click();
      cy.get('[data-testid="test-notification"]').click();
      cy.wait('@testNotification');

      cy.get('[data-testid="test-notification-success"]')
        .should('be.visible')
        .and('contain', 'Test notification sent');
    });
  });

  describe('Theme & Display', () => {
    beforeEach(() => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          theme: 'dark',
          language: 'es',
          fontSize: 'large',
        },
      }).as('updatePreferences');
    });

    it('should change theme', () => {
      cy.get('[data-testid="display-section"]').click();
      cy.get('[data-testid="theme-selector"]').select('dark');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updatePreferences');

      cy.get('body').should('have.class', 'dark-theme');
    });

    it('should change language', () => {
      cy.get('[data-testid="display-section"]').click();
      cy.get('[data-testid="language-selector"]').select('es');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updatePreferences');

      cy.get('[data-testid="settings-title"]').should(
        'contain',
        'Configuración'
      );
    });

    it('should change font size', () => {
      cy.get('[data-testid="display-section"]').click();
      cy.get('[data-testid="font-size-selector"]').select('large');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updatePreferences');

      cy.get('body').should('have.class', 'font-size-large');
    });
  });

  describe('Error Handling', () => {
    it('should handle profile update errors', () => {
      cy.intercept('PUT', '/api/users/1/profile', {
        statusCode: 500,
        body: {
          error: 'Failed to update profile',
        },
      }).as('profileError');

      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="username"]').clear().type('newusername');
      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@profileError');

      cy.get('[data-testid="profile-error"]')
        .should('be.visible')
        .and('contain', 'Failed to update profile');
    });

    it('should handle password update errors', () => {
      cy.intercept('PUT', '/api/users/1/password', {
        statusCode: 400,
        body: {
          error: 'Current password is incorrect',
        },
      }).as('passwordError');

      cy.get('[data-testid="security-section"]').click();
      cy.get('[data-testid="current-password"]').type('wrongpassword');
      cy.get('[data-testid="new-password"]').type('newpassword123');
      cy.get('[data-testid="confirm-password"]').type('newpassword123');
      cy.get('[data-testid="update-password"]').click();
      cy.wait('@passwordError');

      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .and('contain', 'Current password is incorrect');
    });

    it('should handle preference update errors', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 500,
        body: {
          error: 'Failed to update preferences',
        },
      }).as('preferencesError');

      cy.get('[data-testid="display-section"]').click();
      cy.get('[data-testid="theme-selector"]').select('dark');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@preferencesError');

      cy.get('[data-testid="preferences-error"]')
        .should('be.visible')
        .and('contain', 'Failed to update preferences');
    });
  });
});
