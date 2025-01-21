describe('User Profile', () => {
  beforeEach(() => {
    // Login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          avatar: 'https://example.com/avatar.jpg',
          preferences: {
            theme: 'light',
            notifications: true,
            emailUpdates: true,
          },
        },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock profile data
    cy.intercept('GET', '/api/users/1', {
      statusCode: 200,
      body: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test user bio',
        location: 'Test City',
        website: 'https://example.com',
        joinedAt: '2024-01-01T00:00:00Z',
        universeCount: 10,
        collaborationCount: 5,
        preferences: {
          theme: 'light',
          notifications: true,
          emailUpdates: true,
          accessibility: {
            highContrast: false,
            fontSize: 'medium',
          },
        },
      },
    }).as('getProfile');

    // Mock activity data
    cy.intercept('GET', '/api/users/1/activity', {
      statusCode: 200,
      body: {
        recentUniverses: [
          {
            id: 1,
            name: 'Test Universe',
            lastAccessed: '2024-01-15T00:00:00Z',
          },
        ],
        recentCollaborations: [
          {
            id: 1,
            name: 'Collab Universe',
            role: 'editor',
            lastAccessed: '2024-01-14T00:00:00Z',
          },
        ],
      },
    }).as('getActivity');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/profile');
    cy.wait(['@getProfile', '@getActivity']);
  });

  it('should display profile information', () => {
    cy.get('[data-testid="profile-header"]').within(() => {
      cy.get('[data-testid="avatar"]').should('be.visible');
      cy.contains('testuser').should('be.visible');
      cy.contains('test@example.com').should('be.visible');
    });

    cy.get('[data-testid="profile-stats"]').within(() => {
      cy.contains('10 Universes').should('be.visible');
      cy.contains('5 Collaborations').should('be.visible');
    });
  });

  it('should edit profile information', () => {
    cy.intercept('PUT', '/api/users/1', {
      statusCode: 200,
      body: {
        username: 'updateduser',
        bio: 'Updated bio',
        location: 'New City',
        website: 'https://updated.com',
      },
    }).as('updateProfile');

    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('input[name="username"]').clear().type('updateduser');
    cy.get('textarea[name="bio"]').clear().type('Updated bio');
    cy.get('input[name="location"]').clear().type('New City');
    cy.get('input[name="website"]').clear().type('https://updated.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@updateProfile');
    cy.contains('Profile updated successfully').should('be.visible');
  });

  it('should update avatar', () => {
    cy.intercept('POST', '/api/users/1/avatar', {
      statusCode: 200,
      body: {
        avatar: 'https://example.com/new-avatar.jpg',
      },
    }).as('updateAvatar');

    const avatarFile = new File(['avatar content'], 'avatar.jpg', {
      type: 'image/jpeg',
    });
    cy.get('[data-testid="avatar-upload"]').attachFile(avatarFile);

    cy.wait('@updateAvatar');
    cy.contains('Avatar updated successfully').should('be.visible');
  });

  it('should manage notification preferences', () => {
    cy.intercept('PUT', '/api/users/1/preferences', {
      statusCode: 200,
      body: {
        notifications: false,
        emailUpdates: true,
      },
    }).as('updatePreferences');

    cy.get('[data-testid="preferences-tab"]').click();
    cy.get('[data-testid="notification-toggle"]').click();
    cy.get('[data-testid="save-preferences"]').click();

    cy.wait('@updatePreferences');
    cy.contains('Preferences updated successfully').should('be.visible');
  });

  it('should manage accessibility settings', () => {
    cy.intercept('PUT', '/api/users/1/preferences', {
      statusCode: 200,
      body: {
        accessibility: {
          highContrast: true,
          fontSize: 'large',
        },
      },
    }).as('updateAccessibility');

    cy.get('[data-testid="accessibility-tab"]').click();
    cy.get('[data-testid="high-contrast-toggle"]').click();
    cy.get('[data-testid="font-size-selector"]').select('large');
    cy.get('[data-testid="save-accessibility"]').click();

    cy.wait('@updateAccessibility');
    cy.contains('Accessibility settings updated').should('be.visible');
  });

  it('should display activity history', () => {
    cy.get('[data-testid="activity-tab"]').click();

    cy.get('[data-testid="recent-universes"]').within(() => {
      cy.contains('Test Universe').should('be.visible');
      cy.contains('Last accessed: Jan 15, 2024').should('be.visible');
    });

    cy.get('[data-testid="recent-collaborations"]').within(() => {
      cy.contains('Collab Universe').should('be.visible');
      cy.contains('Role: editor').should('be.visible');
    });
  });

  it('should manage security settings', () => {
    cy.get('[data-testid="security-tab"]').click();

    // Change password
    cy.intercept('PUT', '/api/users/1/password', {
      statusCode: 200,
    }).as('updatePassword');

    cy.get('input[name="currentPassword"]').type('password123');
    cy.get('input[name="newPassword"]').type('newpassword123');
    cy.get('input[name="confirmPassword"]').type('newpassword123');
    cy.get('[data-testid="change-password-button"]').click();

    cy.wait('@updatePassword');
    cy.contains('Password updated successfully').should('be.visible');

    // Enable 2FA
    cy.intercept('POST', '/api/users/1/2fa/enable', {
      statusCode: 200,
      body: {
        qrCode: 'data:image/png;base64,fake-qr-code',
        secret: 'FAKE2FASECRET',
      },
    }).as('enable2FA');

    cy.get('[data-testid="enable-2fa-button"]').click();
    cy.get('[data-testid="2fa-qr-code"]').should('be.visible');
    cy.get('input[name="2fa-code"]').type('123456');
    cy.get('[data-testid="verify-2fa-button"]').click();

    cy.contains('Two-factor authentication enabled').should('be.visible');
  });

  it('should manage connected accounts', () => {
    cy.get('[data-testid="connections-tab"]').click();

    // Connect GitHub account
    cy.intercept('POST', '/api/users/1/connections/github', {
      statusCode: 200,
      body: {
        provider: 'github',
        username: 'testuser',
        connected: true,
      },
    }).as('connectGithub');

    cy.get('[data-testid="connect-github"]').click();
    cy.wait('@connectGithub');
    cy.contains('GitHub account connected').should('be.visible');

    // Disconnect account
    cy.intercept('DELETE', '/api/users/1/connections/github', {
      statusCode: 200,
    }).as('disconnectGithub');

    cy.get('[data-testid="disconnect-github"]').click();
    cy.get('[data-testid="confirm-disconnect"]').click();
    cy.wait('@disconnectGithub');
    cy.contains('GitHub account disconnected').should('be.visible');
  });

  it('should handle data export', () => {
    cy.get('[data-testid="data-tab"]').click();

    cy.intercept('POST', '/api/users/1/export', {
      statusCode: 200,
      body: {
        exportId: 'export-123',
        status: 'processing',
      },
    }).as('requestExport');

    cy.get('[data-testid="request-export"]').click();
    cy.wait('@requestExport');
    cy.contains('Export requested').should('be.visible');

    // Simulate export completion
    cy.intercept('GET', '/api/users/1/export/export-123', {
      statusCode: 200,
      body: {
        status: 'completed',
        downloadUrl: 'https://example.com/export.zip',
      },
    }).as('checkExport');

    cy.wait('@checkExport');
    cy.get('[data-testid="download-export"]').should('be.visible');
  });

  it('should handle account deletion', () => {
    cy.get('[data-testid="danger-zone-tab"]').click();

    cy.intercept('DELETE', '/api/users/1', {
      statusCode: 200,
    }).as('deleteAccount');

    cy.get('[data-testid="delete-account-button"]').click();
    cy.get('input[name="confirmation"]').type('DELETE');
    cy.get('[data-testid="confirm-delete-account"]').click();

    cy.wait('@deleteAccount');
    cy.url().should('include', '/');
    cy.contains('Account deleted successfully').should('be.visible');
  });
});
