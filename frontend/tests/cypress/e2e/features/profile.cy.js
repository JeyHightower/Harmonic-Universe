describe('Profile', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login();
    cy.intercept('GET', '/api/users/profile', {
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
            push: false,
          },
        },
      },
    }).as('getProfile');
  });

  describe('Profile Display', () => {
    it('should display user profile information', () => {
      cy.get('[data-testid="profile-username"]').should('contain', 'testuser');
      cy.get('[data-testid="profile-email"]').should(
        'contain',
        'test@example.com'
      );
      cy.get('[data-testid="profile-avatar"]').should(
        'have.attr',
        'src',
        'https://example.com/avatar.jpg'
      );
      cy.get('[data-testid="profile-bio"]').should('contain', 'Test bio');
    });

    it('should show loading state while fetching profile', () => {
      cy.intercept('GET', '/api/users/profile', {
        delay: 1000,
        statusCode: 200,
        body: {
          id: 1,
          username: 'testuser',
        },
      }).as('getProfileDelayed');
      cy.get('[data-testid="profile-loading"]').should('be.visible');
      cy.wait('@getProfileDelayed');
      cy.get('[data-testid="profile-loading"]').should('not.exist');
    });

    it('should handle missing profile data gracefully', () => {
      cy.intercept('GET', '/api/users/profile', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'testuser',
        },
      }).as('getPartialProfile');
      cy.get('[data-testid="profile-bio"]').should(
        'contain',
        'No bio provided'
      );
      cy.get('[data-testid="profile-avatar"]')
        .should('have.attr', 'src')
        .and('include', 'default-avatar');
    });
  });

  describe('Profile Editing', () => {
    it('should allow editing profile information', () => {
      cy.intercept('PUT', '/api/users/profile', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'newusername',
          email: 'newemail@example.com',
          bio: 'Updated bio',
        },
      }).as('updateProfile');

      cy.get('[data-testid="edit-profile-button"]').click();
      cy.get('[data-testid="edit-username"]').clear().type('newusername');
      cy.get('[data-testid="edit-email"]').clear().type('newemail@example.com');
      cy.get('[data-testid="edit-bio"]').clear().type('Updated bio');
      cy.get('[data-testid="save-profile"]').click();

      cy.wait('@updateProfile');
      cy.get('[data-testid="profile-username"]').should(
        'contain',
        'newusername'
      );
      cy.get('[data-testid="profile-email"]').should(
        'contain',
        'newemail@example.com'
      );
      cy.get('[data-testid="profile-bio"]').should('contain', 'Updated bio');
    });

    it('should validate profile updates', () => {
      cy.get('[data-testid="edit-profile-button"]').click();
      cy.get('[data-testid="edit-email"]').clear().type('invalid-email');
      cy.get('[data-testid="save-profile"]').click();
      cy.get('[data-testid="email-error"]').should('be.visible');
    });

    it('should handle profile update errors', () => {
      cy.intercept('PUT', '/api/users/profile', {
        statusCode: 500,
        body: { error: 'Failed to update profile' },
      }).as('updateProfileError');

      cy.get('[data-testid="edit-profile-button"]').click();
      cy.get('[data-testid="edit-username"]').clear().type('newusername');
      cy.get('[data-testid="save-profile"]').click();
      cy.get('[data-testid="update-error"]').should('be.visible');
    });
  });

  describe('Avatar Management', () => {
    it('should allow uploading new avatar', () => {
      cy.intercept('POST', '/api/users/avatar', {
        statusCode: 200,
        body: {
          avatar: 'https://example.com/new-avatar.jpg',
        },
      }).as('uploadAvatar');

      cy.get('[data-testid="edit-avatar-button"]').click();
      cy.get('[data-testid="avatar-upload"]').attachFile('test-avatar.jpg');
      cy.wait('@uploadAvatar');
      cy.get('[data-testid="profile-avatar"]').should(
        'have.attr',
        'src',
        'https://example.com/new-avatar.jpg'
      );
    });

    it('should validate avatar uploads', () => {
      cy.get('[data-testid="edit-avatar-button"]').click();
      cy.get('[data-testid="avatar-upload"]').attachFile('invalid-file.txt');
      cy.get('[data-testid="avatar-error"]').should('be.visible');
    });

    it('should handle avatar upload errors', () => {
      cy.intercept('POST', '/api/users/avatar', {
        statusCode: 500,
        body: { error: 'Failed to upload avatar' },
      }).as('uploadAvatarError');

      cy.get('[data-testid="edit-avatar-button"]').click();
      cy.get('[data-testid="avatar-upload"]').attachFile('test-avatar.jpg');
      cy.get('[data-testid="upload-error"]').should('be.visible');
    });
  });

  describe('Preferences Management', () => {
    it('should allow updating theme preference', () => {
      cy.intercept('PUT', '/api/users/preferences', {
        statusCode: 200,
        body: {
          preferences: {
            theme: 'dark',
          },
        },
      }).as('updatePreferences');

      cy.get('[data-testid="preferences-button"]').click();
      cy.get('[data-testid="theme-selector"]').select('dark');
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updatePreferences');
      cy.get('body').should('have.class', 'dark-theme');
    });

    it('should allow updating notification preferences', () => {
      cy.intercept('PUT', '/api/users/preferences', {
        statusCode: 200,
        body: {
          preferences: {
            notifications: {
              email: false,
              push: true,
            },
          },
        },
      }).as('updateNotificationPreferences');

      cy.get('[data-testid="preferences-button"]').click();
      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="push-notifications"]').check();
      cy.get('[data-testid="save-preferences"]').click();
      cy.wait('@updateNotificationPreferences');
    });

    it('should handle preference update errors', () => {
      cy.intercept('PUT', '/api/users/preferences', {
        statusCode: 500,
        body: { error: 'Failed to update preferences' },
      }).as('updatePreferencesError');

      cy.get('[data-testid="preferences-button"]').click();
      cy.get('[data-testid="theme-selector"]').select('dark');
      cy.get('[data-testid="save-preferences"]').click();
      cy.get('[data-testid="preferences-error"]').should('be.visible');
    });
  });

  describe('Security Settings', () => {
    it('should allow changing password', () => {
      cy.intercept('PUT', '/api/users/password', {
        statusCode: 200,
        body: { message: 'Password updated successfully' },
      }).as('updatePassword');

      cy.get('[data-testid="security-button"]').click();
      cy.get('[data-testid="current-password"]').type('oldpassword');
      cy.get('[data-testid="new-password"]').type('newpassword');
      cy.get('[data-testid="confirm-password"]').type('newpassword');
      cy.get('[data-testid="update-password"]').click();
      cy.wait('@updatePassword');
      cy.get('[data-testid="password-success"]').should('be.visible');
    });

    it('should validate password changes', () => {
      cy.get('[data-testid="security-button"]').click();
      cy.get('[data-testid="new-password"]').type('weak');
      cy.get('[data-testid="update-password"]').click();
      cy.get('[data-testid="password-error"]').should('be.visible');
    });

    it('should handle password update errors', () => {
      cy.intercept('PUT', '/api/users/password', {
        statusCode: 500,
        body: { error: 'Failed to update password' },
      }).as('updatePasswordError');

      cy.get('[data-testid="security-button"]').click();
      cy.get('[data-testid="current-password"]').type('oldpassword');
      cy.get('[data-testid="new-password"]').type('newpassword');
      cy.get('[data-testid="confirm-password"]').type('newpassword');
      cy.get('[data-testid="update-password"]').click();
      cy.get('[data-testid="password-error"]').should('be.visible');
    });
  });
});
