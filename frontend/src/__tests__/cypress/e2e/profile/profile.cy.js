describe('User Profile Features', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          avatar_url: 'https://example.com/avatar.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock profile data
    cy.intercept('GET', '/api/users/1/profile', {
      statusCode: 200,
      body: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test user bio',
        created_at: '2024-01-01T00:00:00Z',
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            collaboration: true,
          },
          accessibility: {
            high_contrast: false,
            font_size: 'medium',
          },
        },
        stats: {
          universes_created: 10,
          collaborations: 5,
          total_edits: 100,
        },
      },
    }).as('getProfile');

    // Mock activity history
    cy.intercept('GET', '/api/users/1/activity', {
      statusCode: 200,
      body: {
        recent_universes: [
          {
            id: 1,
            name: 'Test Universe 1',
            last_accessed: '2024-01-15T00:00:00Z',
          },
          {
            id: 2,
            name: 'Test Universe 2',
            last_accessed: '2024-01-14T00:00:00Z',
          },
        ],
        recent_collaborations: [
          {
            id: 1,
            universe_name: 'Collab Universe 1',
            owner: 'otheruser',
            last_active: '2024-01-15T00:00:00Z',
          },
        ],
        edit_history: [
          {
            id: 1,
            action: 'update_physics',
            universe_name: 'Test Universe 1',
            timestamp: '2024-01-15T00:00:00Z',
          },
        ],
      },
    }).as('getActivity');

    // Mock connected accounts
    cy.intercept('GET', '/api/users/1/connections', {
      statusCode: 200,
      body: {
        github: {
          connected: true,
          username: 'testuser',
          avatar_url: 'https://github.com/avatar.jpg',
        },
        google: {
          connected: false,
        },
      },
    }).as('getConnections');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/profile');
    cy.wait(['@getProfile', '@getActivity', '@getConnections']);
  });

  it('should display profile information', () => {
    // Check basic info
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
    cy.get('[data-testid="join-date"]').should('contain', 'January 1, 2024');

    // Check stats
    cy.get('[data-testid="profile-stats"]').within(() => {
      cy.get('[data-testid="universes-count"]').should('contain', '10');
      cy.get('[data-testid="collaborations-count"]').should('contain', '5');
      cy.get('[data-testid="edits-count"]').should('contain', '100');
    });
  });

  it('should handle profile editing', () => {
    // Mock profile update
    cy.intercept('PUT', '/api/users/1/profile', {
      statusCode: 200,
      body: {
        username: 'newusername',
        bio: 'Updated bio',
      },
    }).as('updateProfile');

    // Edit profile
    cy.get('[data-testid="edit-profile"]').click();
    cy.get('[data-testid="username-input"]').clear().type('newusername');
    cy.get('[data-testid="bio-input"]').clear().type('Updated bio');
    cy.get('[data-testid="save-profile"]').click();

    // Verify changes
    cy.wait('@updateProfile');
    cy.get('[data-testid="profile-username"]').should('contain', 'newusername');
    cy.get('[data-testid="profile-bio"]').should('contain', 'Updated bio');
    cy.get('[data-testid="profile-updated"]').should('be.visible');
  });

  it('should handle avatar management', () => {
    // Mock avatar upload
    cy.intercept('POST', '/api/users/1/avatar', {
      statusCode: 200,
      body: {
        avatar_url: 'https://example.com/new-avatar.jpg',
      },
    }).as('uploadAvatar');

    // Upload new avatar
    cy.get('[data-testid="change-avatar"]').click();
    cy.get('[data-testid="avatar-input"]').attachFile('test-avatar.jpg');
    cy.get('[data-testid="crop-avatar"]').should('be.visible');
    cy.get('[data-testid="save-avatar"]').click();

    // Verify update
    cy.wait('@uploadAvatar');
    cy.get('[data-testid="profile-avatar"]').should(
      'have.attr',
      'src',
      'https://example.com/new-avatar.jpg'
    );
    cy.get('[data-testid="avatar-updated"]').should('be.visible');
  });

  it('should handle notification preferences', () => {
    // Mock preferences update
    cy.intercept('PUT', '/api/users/1/preferences', {
      statusCode: 200,
      body: {
        notifications: {
          email: true,
          push: false,
          collaboration: true,
        },
      },
    }).as('updatePreferences');

    // Update preferences
    cy.get('[data-testid="preferences-tab"]').click();
    cy.get('[data-testid="notification-settings"]').within(() => {
      cy.get('[data-testid="email-notifications"]').check();
      cy.get('[data-testid="push-notifications"]').uncheck();
      cy.get('[data-testid="collab-notifications"]').check();
    });
    cy.get('[data-testid="save-preferences"]').click();

    // Verify update
    cy.wait('@updatePreferences');
    cy.get('[data-testid="preferences-updated"]').should('be.visible');
  });

  it('should handle accessibility settings', () => {
    // Mock accessibility update
    cy.intercept('PUT', '/api/users/1/accessibility', {
      statusCode: 200,
      body: {
        high_contrast: true,
        font_size: 'large',
      },
    }).as('updateAccessibility');

    // Update settings
    cy.get('[data-testid="accessibility-tab"]').click();
    cy.get('[data-testid="high-contrast"]').check();
    cy.get('[data-testid="font-size"]').select('large');
    cy.get('[data-testid="save-accessibility"]').click();

    // Verify update
    cy.wait('@updateAccessibility');
    cy.get('[data-testid="accessibility-updated"]').should('be.visible');
    cy.get('body')
      .should('have.class', 'high-contrast')
      .and('have.class', 'font-size-large');
  });

  it('should display activity history', () => {
    cy.get('[data-testid="activity-tab"]').click();

    // Check recent universes
    cy.get('[data-testid="recent-universes"]').within(() => {
      cy.contains('Test Universe 1').should('be.visible');
      cy.contains('Test Universe 2').should('be.visible');
    });

    // Check collaborations
    cy.get('[data-testid="recent-collaborations"]').within(() => {
      cy.contains('Collab Universe 1').should('be.visible');
      cy.contains('otheruser').should('be.visible');
    });

    // Check edit history
    cy.get('[data-testid="edit-history"]').within(() => {
      cy.contains('Test Universe 1').should('be.visible');
      cy.contains('update_physics').should('be.visible');
    });
  });

  it('should handle security settings', () => {
    cy.get('[data-testid="security-tab"]').click();

    // Mock password change
    cy.intercept('POST', '/api/auth/change-password', {
      statusCode: 200,
    }).as('changePassword');

    // Change password
    cy.get('[data-testid="change-password"]').click();
    cy.get('[data-testid="current-password"]').type('password123');
    cy.get('[data-testid="new-password"]').type('newpassword123');
    cy.get('[data-testid="confirm-password"]').type('newpassword123');
    cy.get('[data-testid="save-password"]').click();

    // Verify password change
    cy.wait('@changePassword');
    cy.get('[data-testid="password-updated"]').should('be.visible');

    // Mock 2FA setup
    cy.intercept('POST', '/api/auth/2fa/enable', {
      statusCode: 200,
      body: {
        qr_code: 'data:image/png;base64,fake-qr-code',
        secret: 'ABCDEF123456',
      },
    }).as('enable2FA');

    // Enable 2FA
    cy.get('[data-testid="enable-2fa"]').click();
    cy.get('[data-testid="2fa-qr-code"]').should('be.visible');
    cy.get('[data-testid="2fa-code"]').type('123456');
    cy.get('[data-testid="verify-2fa"]').click();
    cy.get('[data-testid="2fa-enabled"]').should('be.visible');
  });

  it('should handle connected accounts', () => {
    cy.get('[data-testid="connections-tab"]').click();

    // Check GitHub connection
    cy.get('[data-testid="github-connection"]').within(() => {
      cy.get('[data-testid="connection-status"]').should(
        'contain',
        'Connected'
      );
      cy.get('[data-testid="github-username"]').should('contain', 'testuser');
      cy.get('[data-testid="disconnect-github"]').should('be.visible');
    });

    // Mock GitHub disconnect
    cy.intercept('DELETE', '/api/users/1/connections/github', {
      statusCode: 200,
    }).as('disconnectGithub');

    // Disconnect GitHub
    cy.get('[data-testid="disconnect-github"]').click();
    cy.get('[data-testid="confirm-disconnect"]').click();
    cy.wait('@disconnectGithub');
    cy.get('[data-testid="github-connection"]').should(
      'contain',
      'Not connected'
    );

    // Mock Google connect
    cy.intercept('GET', '/api/auth/google', {
      statusCode: 200,
    }).as('connectGoogle');

    // Connect Google
    cy.get('[data-testid="connect-google"]').click();
    // Note: actual OAuth flow would happen here
    cy.get('[data-testid="google-connected"]').should('be.visible');
  });

  it('should handle data export', () => {
    cy.get('[data-testid="data-tab"]').click();

    // Mock export request
    cy.intercept('POST', '/api/users/1/export', {
      statusCode: 200,
      body: {
        export_id: 'export-123',
        status: 'processing',
      },
    }).as('requestExport');

    // Request export
    cy.get('[data-testid="request-export"]').click();
    cy.get('[data-testid="export-format"]').select('json');
    cy.get('[data-testid="start-export"]').click();

    // Check export status
    cy.wait('@requestExport');
    cy.get('[data-testid="export-status"]').should('contain', 'Processing');

    // Mock export completion
    cy.intercept('GET', '/api/users/1/export/export-123', {
      statusCode: 200,
      body: {
        status: 'completed',
        download_url: 'https://example.com/export.zip',
      },
    }).as('checkExport');

    // Verify export completion
    cy.get('[data-testid="export-complete"]').should('be.visible');
    cy.get('[data-testid="download-export"]').should(
      'have.attr',
      'href',
      'https://example.com/export.zip'
    );
  });

  it('should handle account deletion', () => {
    cy.get('[data-testid="data-tab"]').click();

    // Mock account deletion
    cy.intercept('DELETE', '/api/users/1', {
      statusCode: 200,
    }).as('deleteAccount');

    // Initiate deletion
    cy.get('[data-testid="delete-account"]').click();
    cy.get('[data-testid="confirm-deletion"]').type('DELETE');
    cy.get('[data-testid="confirm-delete-button"]').click();

    // Verify deletion
    cy.wait('@deleteAccount');
    cy.url().should('include', '/goodbye');
    cy.get('[data-testid="account-deleted"]').should('be.visible');
  });
});
