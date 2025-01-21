describe('User Profile Features', () => {
  beforeEach(() => {
    // Login
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
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            collaboration: true,
          },
          accessibility: {
            highContrast: false,
            fontSize: 'medium',
            reducedMotion: false,
          },
        },
        connected_accounts: [
          {
            provider: 'github',
            username: 'testuser',
            connected_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    }).as('getProfile');

    // Mock user activity
    cy.intercept('GET', '/api/users/1/activity', {
      statusCode: 200,
      body: {
        recent_universes: [
          {
            id: 1,
            name: 'Test Universe',
            last_accessed: '2024-01-15T00:00:00Z',
          },
        ],
        recent_collaborations: [
          {
            id: 1,
            universe_name: 'Collab Universe',
            owner: 'collaborator',
            last_active: '2024-01-14T00:00:00Z',
          },
        ],
        activity_log: [
          {
            type: 'universe_created',
            details: 'Created universe "Test Universe"',
            timestamp: '2024-01-15T00:00:00Z',
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
    // Check basic info
    cy.get('[data-testid="profile-username"]').should('contain', 'testuser');
    cy.get('[data-testid="profile-email"]').should(
      'contain',
      'test@example.com'
    );
    cy.get('[data-testid="profile-avatar"]')
      .should('have.attr', 'src')
      .and('include', 'avatar.jpg');

    // Check join date
    cy.get('[data-testid="join-date"]').should('contain', 'January 1, 2024');

    // Check activity summary
    cy.get('[data-testid="activity-summary"]').within(() => {
      cy.get('[data-testid="universes-count"]').should('exist');
      cy.get('[data-testid="collaborations-count"]').should('exist');
    });
  });

  it('should handle profile editing', () => {
    // Enter edit mode
    cy.get('[data-testid="edit-profile"]').click();

    // Update username
    cy.get('[data-testid="username-input"]').clear().type('newusername');

    // Update bio
    cy.get('[data-testid="bio-input"]').type('A test user profile');

    // Save changes
    cy.get('[data-testid="save-profile"]').click();
    cy.get('[data-testid="profile-updated"]').should('be.visible');

    // Verify updates
    cy.get('[data-testid="profile-username"]').should('contain', 'newusername');
    cy.get('[data-testid="profile-bio"]').should(
      'contain',
      'A test user profile'
    );
  });

  it('should handle avatar management', () => {
    // Open avatar editor
    cy.get('[data-testid="edit-avatar"]').click();

    // Upload new avatar
    cy.get('[data-testid="avatar-upload"]').attachFile('test-avatar.jpg');

    // Adjust crop
    cy.get('[data-testid="avatar-crop"]').within(() => {
      cy.get('[data-testid="crop-slider"]')
        .invoke('val', 1.5)
        .trigger('change');
      cy.get('[data-testid="rotate-right"]').click();
    });

    // Save avatar
    cy.get('[data-testid="save-avatar"]').click();
    cy.get('[data-testid="avatar-updated"]').should('be.visible');

    // Verify new avatar
    cy.get('[data-testid="profile-avatar"]')
      .should('have.attr', 'src')
      .and('include', 'new-avatar');
  });

  it('should handle notification preferences', () => {
    cy.get('[data-testid="notification-settings"]').click();

    // Update email preferences
    cy.get('[data-testid="email-notifications"]').within(() => {
      cy.get('[data-testid="notify-comments"]').check();
      cy.get('[data-testid="notify-mentions"]').check();
      cy.get('[data-testid="notify-updates"]').uncheck();
    });

    // Update push preferences
    cy.get('[data-testid="push-notifications"]').within(() => {
      cy.get('[data-testid="notify-realtime"]').check();
      cy.get('[data-testid="notify-collaboration"]').check();
    });

    // Save preferences
    cy.get('[data-testid="save-notifications"]').click();
    cy.get('[data-testid="preferences-updated"]').should('be.visible');

    // Verify updates
    cy.get('[data-testid="email-notifications"]')
      .find('[data-testid="notify-comments"]')
      .should('be.checked');
  });

  it('should handle accessibility settings', () => {
    cy.get('[data-testid="accessibility-settings"]').click();

    // Update visual preferences
    cy.get('[data-testid="high-contrast"]').check();
    cy.get('[data-testid="font-size"]').select('large');
    cy.get('[data-testid="reduced-motion"]').check();

    // Update keyboard preferences
    cy.get('[data-testid="keyboard-shortcuts"]').check();
    cy.get('[data-testid="screen-reader"]').check();

    // Save settings
    cy.get('[data-testid="save-accessibility"]').click();
    cy.get('[data-testid="settings-updated"]').should('be.visible');

    // Verify updates
    cy.get('html')
      .should('have.class', 'high-contrast')
      .and('have.class', 'text-lg')
      .and('have.class', 'reduced-motion');
  });

  it('should display activity history', () => {
    cy.get('[data-testid="activity-tab"]').click();

    // Check recent universes
    cy.get('[data-testid="recent-universes"]').within(() => {
      cy.contains('Test Universe').should('be.visible');
      cy.contains('January 15, 2024').should('be.visible');
    });

    // Check recent collaborations
    cy.get('[data-testid="recent-collaborations"]').within(() => {
      cy.contains('Collab Universe').should('be.visible');
      cy.contains('collaborator').should('be.visible');
    });

    // Check activity log
    cy.get('[data-testid="activity-log"]').within(() => {
      cy.contains('Created universe').should('be.visible');
      cy.contains('Test Universe').should('be.visible');
    });

    // Test activity filters
    cy.get('[data-testid="activity-filter"]').select('collaborations');
    cy.get('[data-testid="activity-log"]').should('contain', 'Collab Universe');
  });

  it('should handle security settings', () => {
    cy.get('[data-testid="security-settings"]').click();

    // Change password
    cy.get('[data-testid="change-password"]').click();
    cy.get('[data-testid="current-password"]').type('password123');
    cy.get('[data-testid="new-password"]').type('newpassword123');
    cy.get('[data-testid="confirm-password"]').type('newpassword123');
    cy.get('[data-testid="save-password"]').click();
    cy.get('[data-testid="password-updated"]').should('be.visible');

    // Enable 2FA
    cy.get('[data-testid="enable-2fa"]').click();
    cy.get('[data-testid="2fa-qr-code"]').should('be.visible');
    cy.get('[data-testid="2fa-code"]').type('123456');
    cy.get('[data-testid="confirm-2fa"]').click();
    cy.get('[data-testid="2fa-enabled"]').should('be.visible');

    // View security log
    cy.get('[data-testid="security-log"]').click();
    cy.get('[data-testid="login-history"]').should('be.visible');
  });

  it('should handle connected accounts', () => {
    cy.get('[data-testid="connected-accounts"]').click();

    // Check existing connections
    cy.get('[data-testid="github-connection"]').within(() => {
      cy.contains('Connected').should('be.visible');
      cy.contains('testuser').should('be.visible');
    });

    // Connect new account
    cy.get('[data-testid="connect-gitlab"]').click();
    cy.get('[data-testid="gitlab-auth"]').should('be.visible');

    // Disconnect account
    cy.get('[data-testid="github-connection"]')
      .find('[data-testid="disconnect"]')
      .click();
    cy.get('[data-testid="confirm-disconnect"]').click();
    cy.get('[data-testid="account-disconnected"]').should('be.visible');
  });

  it('should handle data export', () => {
    cy.get('[data-testid="data-export"]').click();

    // Configure export
    cy.get('[data-testid="export-universes"]').check();
    cy.get('[data-testid="export-collaborations"]').check();
    cy.get('[data-testid="export-settings"]').check();

    // Start export
    cy.get('[data-testid="start-export"]').click();
    cy.get('[data-testid="export-progress"]').should('be.visible');

    // Download export
    cy.get('[data-testid="download-export"]')
      .should('have.attr', 'href')
      .and('include', '/exports/');
  });

  it('should handle account deletion', () => {
    cy.get('[data-testid="account-settings"]').click();
    cy.get('[data-testid="delete-account"]').click();

    // Confirm deletion
    cy.get('[data-testid="delete-reason"]').type('Testing account deletion');
    cy.get('[data-testid="confirm-password"]').type('password123');
    cy.get('[data-testid="confirm-delete"]').click();

    // Verify deletion
    cy.get('[data-testid="account-deleted"]').should('be.visible');
    cy.url().should('include', '/login');
  });
});
