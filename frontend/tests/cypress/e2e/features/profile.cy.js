describe('Profile Management Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock profile data
    cy.intercept('GET', '/api/users/profile', {
      statusCode: 200,
      body: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test user bio',
        preferences: {
          theme: 'light',
          language: 'en',
          emailNotifications: true,
          pushNotifications: false,
        },
        activity: {
          universeCount: 10,
          collaborationCount: 5,
          lastActive: new Date().toISOString(),
        },
      },
    }).as('getProfile');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/profile');
    cy.wait('@getProfile');
  });

  describe('Profile Settings', () => {
    it('should update basic information', () => {
      cy.intercept('PUT', '/api/users/profile', {
        statusCode: 200,
        body: {
          username: 'newusername',
          bio: 'Updated bio',
        },
      }).as('updateProfile');

      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="username-input"]').clear().type('newusername');
      cy.get('[data-testid="bio-input"]').clear().type('Updated bio');
      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@updateProfile');

      cy.get('[data-testid="profile-username"]').should(
        'contain',
        'newusername'
      );
      cy.get('[data-testid="profile-bio"]').should('contain', 'Updated bio');
    });

    it('should update avatar', () => {
      cy.intercept('POST', '/api/users/profile/avatar', {
        statusCode: 200,
        body: {
          avatar: 'https://example.com/new-avatar.jpg',
        },
      }).as('updateAvatar');

      cy.get('[data-testid="avatar-upload"]').attachFile({
        fileContent: 'test image content',
        fileName: 'avatar.jpg',
        mimeType: 'image/jpeg',
      });
      cy.wait('@updateAvatar');

      cy.get('[data-testid="profile-avatar"]')
        .should('have.attr', 'src')
        .and('include', 'new-avatar.jpg');
    });
  });

  describe('Account Preferences', () => {
    it('should update theme preferences', () => {
      cy.intercept('PUT', '/api/users/preferences', {
        statusCode: 200,
        body: {
          theme: 'dark',
        },
      }).as('updateTheme');

      cy.get('[data-testid="preferences-tab"]').click();
      cy.get('[data-testid="theme-selector"]').select('dark');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updateTheme');

      cy.get('body').should('have.class', 'dark-theme');
    });

    it('should update language settings', () => {
      cy.intercept('PUT', '/api/users/preferences', {
        statusCode: 200,
        body: {
          language: 'es',
        },
      }).as('updateLanguage');

      cy.get('[data-testid="preferences-tab"]').click();
      cy.get('[data-testid="language-selector"]').select('es');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updateLanguage');

      cy.get('[data-testid="current-language"]').should('contain', 'Español');
    });
  });

  describe('Security Settings', () => {
    it('should change password', () => {
      cy.intercept('PUT', '/api/users/security/password', {
        statusCode: 200,
        body: {
          message: 'Password updated successfully',
        },
      }).as('updatePassword');

      cy.get('[data-testid="security-tab"]').click();
      cy.get('[data-testid="current-password"]').type('password123');
      cy.get('[data-testid="new-password"]').type('newpassword123');
      cy.get('[data-testid="confirm-password"]').type('newpassword123');
      cy.get('[data-testid="update-password"]').click();
      cy.wait('@updatePassword');

      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Password updated successfully');
    });

    it('should manage two-factor authentication', () => {
      cy.intercept('POST', '/api/users/security/2fa/enable', {
        statusCode: 200,
        body: {
          qrCode: 'data:image/png;base64,abc123',
          secret: 'ABCDEF123456',
        },
      }).as('enable2FA');

      cy.get('[data-testid="security-tab"]').click();
      cy.get('[data-testid="enable-2fa"]').click();
      cy.wait('@enable2FA');

      cy.get('[data-testid="2fa-qr-code"]').should('be.visible');
      cy.get('[data-testid="2fa-secret"]').should('contain', 'ABCDEF123456');
    });
  });

  describe('Notification Preferences', () => {
    it('should update email notifications', () => {
      cy.intercept('PUT', '/api/users/notifications/preferences', {
        statusCode: 200,
        body: {
          emailNotifications: {
            comments: true,
            mentions: true,
            updates: false,
          },
        },
      }).as('updateEmailPrefs');

      cy.get('[data-testid="notifications-tab"]').click();
      cy.get('[data-testid="email-comments"]').check();
      cy.get('[data-testid="email-mentions"]').check();
      cy.get('[data-testid="email-updates"]').uncheck();
      cy.get('[data-testid="save-notifications"]').click();
      cy.wait('@updateEmailPrefs');

      cy.get('[data-testid="email-updates"]').should('not.be.checked');
    });

    it('should update push notifications', () => {
      cy.intercept('PUT', '/api/users/notifications/preferences', {
        statusCode: 200,
        body: {
          pushNotifications: {
            enabled: true,
            browser: true,
          },
        },
      }).as('updatePushPrefs');

      cy.get('[data-testid="notifications-tab"]').click();
      cy.get('[data-testid="enable-push"]').check();
      cy.get('[data-testid="enable-browser-notifications"]').check();
      cy.get('[data-testid="save-notifications"]').click();
      cy.wait('@updatePushPrefs');

      cy.get('[data-testid="push-status"]').should('contain', 'Enabled');
    });
  });

  describe('Activity History', () => {
    it('should display recent activity', () => {
      cy.intercept('GET', '/api/users/activity', {
        statusCode: 200,
        body: {
          activities: [
            {
              id: 1,
              type: 'universe_created',
              details: { universeName: 'New Universe' },
              timestamp: new Date().toISOString(),
            },
            {
              id: 2,
              type: 'collaboration_joined',
              details: { universeName: 'Collab Universe' },
              timestamp: new Date().toISOString(),
            },
          ],
        },
      }).as('getActivity');

      cy.get('[data-testid="activity-tab"]').click();
      cy.wait('@getActivity');

      cy.get('[data-testid="activity-list"]').within(() => {
        cy.get('[data-testid="activity-1"]').should('contain', 'New Universe');
        cy.get('[data-testid="activity-2"]').should(
          'contain',
          'Collab Universe'
        );
      });
    });

    it('should filter activity by type', () => {
      cy.intercept('GET', '/api/users/activity?type=universe_created', {
        statusCode: 200,
        body: {
          activities: [
            {
              id: 1,
              type: 'universe_created',
              details: { universeName: 'New Universe' },
              timestamp: new Date().toISOString(),
            },
          ],
        },
      }).as('getFilteredActivity');

      cy.get('[data-testid="activity-tab"]').click();
      cy.get('[data-testid="activity-filter"]').select('universe_created');
      cy.wait('@getFilteredActivity');

      cy.get('[data-testid="activity-list"]')
        .should('contain', 'New Universe')
        .and('not.contain', 'Collab Universe');
    });
  });

  describe('Error Handling', () => {
    it('should handle profile update errors', () => {
      cy.intercept('PUT', '/api/users/profile', {
        statusCode: 400,
        body: {
          error: 'Username already taken',
        },
      }).as('updateError');

      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="username-input"]').clear().type('existinguser');
      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@updateError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Username already taken');
    });

    it('should handle security update errors', () => {
      cy.intercept('PUT', '/api/users/security/password', {
        statusCode: 400,
        body: {
          error: 'Current password incorrect',
        },
      }).as('passwordError');

      cy.get('[data-testid="security-tab"]').click();
      cy.get('[data-testid="current-password"]').type('wrongpassword');
      cy.get('[data-testid="new-password"]').type('newpassword123');
      cy.get('[data-testid="confirm-password"]').type('newpassword123');
      cy.get('[data-testid="update-password"]').click();
      cy.wait('@passwordError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Current password incorrect');
    });
  });
});
