describe('Authentication & Profile', () => {
  beforeEach(() => {
    // Mock user data
    cy.intercept('GET', '/api/users/1', {
      statusCode: 200,
      body: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        profile: {
          avatar_url: 'https://example.com/avatar.jpg',
          bio: 'Test user bio',
          location: 'Test City',
          website: 'https://example.com',
          joined_at: '2024-01-01T00:00:00Z',
        },
        preferences: {
          theme: 'light',
          email_notifications: true,
          push_notifications: true,
          language: 'en',
        },
        stats: {
          universes_count: 5,
          collaborations_count: 3,
          followers_count: 10,
          following_count: 15,
        },
      },
    }).as('getUser');

    // Mock activity data
    cy.intercept('GET', '/api/users/1/activity', {
      statusCode: 200,
      body: {
        activities: [
          {
            id: 1,
            type: 'universe_created',
            details: { universe_id: 1, name: 'New Universe' },
            created_at: '2024-01-20T12:00:00Z',
          },
          {
            id: 2,
            type: 'storyboard_updated',
            details: { storyboard_id: 1, name: 'Updated Storyboard' },
            created_at: '2024-01-19T12:00:00Z',
          },
        ],
      },
    }).as('getActivity');
  });

  describe('Authentication', () => {
    it('should handle signup flow', () => {
      // Mock email verification
      cy.intercept('POST', '/api/auth/verify-email', {
        statusCode: 200,
        body: {
          message: 'Verification email sent',
        },
      }).as('verifyEmail');

      // Mock signup
      cy.intercept('POST', '/api/auth/signup', {
        statusCode: 201,
        body: {
          user: { id: 2, username: 'newuser' },
          message: 'Account created successfully',
        },
      }).as('signup');

      cy.visit('/signup');

      // Fill signup form
      cy.get('[data-testid="signup-username"]').type('newuser');
      cy.get('[data-testid="signup-email"]').type('new@example.com');
      cy.get('[data-testid="signup-password"]').type('password123');
      cy.get('[data-testid="signup-confirm-password"]').type('password123');
      cy.get('[data-testid="signup-terms"]').check();
      cy.get('[data-testid="signup-submit"]').click();

      cy.wait('@signup');
      cy.wait('@verifyEmail');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Account created successfully'
      );
      cy.get('[data-testid="verification-message"]').should(
        'contain',
        'Please check your email'
      );
    });

    it('should handle login flow', () => {
      // Mock login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token',
        },
      }).as('login');

      cy.visit('/login');

      // Fill login form
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@login');
      cy.url().should('include', '/dashboard');
    });

    it('should handle password reset', () => {
      // Mock reset request
      cy.intercept('POST', '/api/auth/reset-password-request', {
        statusCode: 200,
        body: {
          message: 'Reset email sent',
        },
      }).as('resetRequest');

      // Mock reset confirmation
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: {
          message: 'Password reset successfully',
        },
      }).as('resetPassword');

      // Request reset
      cy.visit('/forgot-password');
      cy.get('[data-testid="reset-email"]').type('test@example.com');
      cy.get('[data-testid="request-reset"]').click();
      cy.wait('@resetRequest');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Reset email sent'
      );

      // Reset password
      cy.visit('/reset-password?token=fake-reset-token');
      cy.get('[data-testid="new-password"]').type('newpassword123');
      cy.get('[data-testid="confirm-password"]').type('newpassword123');
      cy.get('[data-testid="reset-submit"]').click();
      cy.wait('@resetPassword');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Password reset successfully'
      );
    });

    it('should handle logout', () => {
      // Mock logout
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          message: 'Logged out successfully',
        },
      }).as('logout');

      cy.login(); // Custom command to set up authenticated state
      cy.visit('/dashboard');
      cy.get('[data-testid="logout-button"]').click();
      cy.wait('@logout');
      cy.url().should('include', '/login');
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.login(); // Custom command to set up authenticated state
      cy.visit('/profile');
      cy.wait('@getUser');
    });

    it('should display profile information', () => {
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
      cy.get('[data-testid="profile-bio"]').should('contain', 'Test user bio');
      cy.get('[data-testid="profile-stats"]').within(() => {
        cy.get('[data-testid="universes-count"]').should('contain', '5');
        cy.get('[data-testid="collaborations-count"]').should('contain', '3');
        cy.get('[data-testid="followers-count"]').should('contain', '10');
        cy.get('[data-testid="following-count"]').should('contain', '15');
      });
    });

    it('should edit profile information', () => {
      cy.intercept('PUT', '/api/users/1/profile', {
        statusCode: 200,
        body: {
          message: 'Profile updated successfully',
          profile: {
            bio: 'Updated bio',
            location: 'New City',
            website: 'https://updated.com',
          },
        },
      }).as('updateProfile');

      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="profile-bio-input"]').clear().type('Updated bio');
      cy.get('[data-testid="profile-location-input"]').clear().type('New City');
      cy.get('[data-testid="profile-website-input"]')
        .clear()
        .type('https://updated.com');
      cy.get('[data-testid="save-profile"]').click();

      cy.wait('@updateProfile');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Profile updated successfully'
      );
    });

    it('should update avatar', () => {
      cy.intercept('POST', '/api/users/1/avatar', {
        statusCode: 200,
        body: {
          message: 'Avatar updated successfully',
          avatar_url: 'https://example.com/new-avatar.jpg',
        },
      }).as('updateAvatar');

      cy.get('[data-testid="edit-avatar"]').click();
      cy.get('[data-testid="avatar-upload"]').attachFile('avatar.jpg');
      cy.get('[data-testid="save-avatar"]').click();

      cy.wait('@updateAvatar');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Avatar updated successfully'
      );
      cy.get('[data-testid="profile-avatar"]').should(
        'have.attr',
        'src',
        'https://example.com/new-avatar.jpg'
      );
    });

    it('should manage notification preferences', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          message: 'Preferences updated successfully',
          preferences: {
            email_notifications: false,
            push_notifications: true,
          },
        },
      }).as('updatePreferences');

      cy.get('[data-testid="preferences-tab"]').click();
      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="push-notifications"]').check();
      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Preferences updated successfully'
      );
    });

    it('should display activity history', () => {
      cy.wait('@getActivity');
      cy.get('[data-testid="activity-tab"]').click();
      cy.get('[data-testid="activity-list"]').within(() => {
        cy.get('[data-testid="activity-1"]').should('contain', 'New Universe');
        cy.get('[data-testid="activity-2"]').should(
          'contain',
          'Updated Storyboard'
        );
      });
    });

    it('should handle account deletion', () => {
      cy.intercept('DELETE', '/api/users/1', {
        statusCode: 200,
        body: {
          message: 'Account deleted successfully',
        },
      }).as('deleteAccount');

      cy.get('[data-testid="account-tab"]').click();
      cy.get('[data-testid="delete-account"]').click();
      cy.get('[data-testid="confirm-delete"]').type('DELETE');
      cy.get('[data-testid="confirm-delete-button"]').click();

      cy.wait('@deleteAccount');
      cy.url().should('include', '/login');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Account deleted successfully'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle signup errors', () => {
      cy.intercept('POST', '/api/auth/signup', {
        statusCode: 400,
        body: {
          error: 'Username already taken',
        },
      }).as('signupError');

      cy.visit('/signup');
      cy.get('[data-testid="signup-username"]').type('existinguser');
      cy.get('[data-testid="signup-email"]').type('test@example.com');
      cy.get('[data-testid="signup-password"]').type('password123');
      cy.get('[data-testid="signup-confirm-password"]').type('password123');
      cy.get('[data-testid="signup-terms"]').check();
      cy.get('[data-testid="signup-submit"]').click();

      cy.wait('@signupError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Username already taken'
      );
    });

    it('should handle login errors', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid credentials',
        },
      }).as('loginError');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('wrong@example.com');
      cy.get('[data-testid="login-password"]').type('wrongpassword');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Invalid credentials'
      );
    });

    it('should handle profile update errors', () => {
      cy.login();
      cy.visit('/profile');
      cy.wait('@getUser');

      cy.intercept('PUT', '/api/users/1/profile', {
        statusCode: 400,
        body: {
          error: 'Invalid website URL',
        },
      }).as('updateError');

      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="profile-website-input"]')
        .clear()
        .type('invalid-url');
      cy.get('[data-testid="save-profile"]').click();

      cy.wait('@updateError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Invalid website URL'
      );
    });
  });
});
