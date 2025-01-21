describe('Service Integration', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
  });

  describe('Universe Creation to Collaboration Flow', () => {
    it('should handle complete universe creation and collaboration workflow', () => {
      // Mock universe creation
      cy.intercept('POST', '/api/universes', {
        statusCode: 201,
        body: {
          id: 1,
          name: 'Integration Test Universe',
          owner_id: 1,
        },
      }).as('createUniverse');

      // Mock WebSocket connection
      cy.intercept('GET', '/socket.io/*', {
        statusCode: 200,
      }).as('socketConnection');

      // Mock audio context initialization
      cy.window().then(win => {
        win.AudioContext = class MockAudioContext {
          constructor() {
            this.state = 'running';
            this.sampleRate = 44100;
          }
          createGain() {
            return { gain: { value: 1 } };
          }
        };
      });

      // Create universe
      cy.visit('/universes/create');
      cy.get('[data-testid="universe-name"]').type('Integration Test Universe');
      cy.get('[data-testid="create-universe"]').click();
      cy.wait('@createUniverse');

      // Verify universe creation and navigation
      cy.url().should('include', '/universe/1');

      // Mock collaboration setup
      cy.intercept('POST', '/api/universes/1/collaborators', {
        statusCode: 200,
        body: {
          collaborator_id: 2,
          role: 'editor',
        },
      }).as('addCollaborator');

      // Add collaborator
      cy.get('[data-testid="share-universe"]').click();
      cy.get('[data-testid="collaborator-email"]').type(
        'collaborator@example.com'
      );
      cy.get('[data-testid="add-collaborator"]').click();
      cy.wait('@addCollaborator');

      // Mock real-time connection
      cy.window().then(win => {
        win.socketClient.emit('user:joined', {
          userId: 2,
          username: 'collaborator',
        });
      });

      // Verify collaboration setup
      cy.get('[data-testid="collaborator-list"]').should(
        'contain',
        'collaborator@example.com'
      );
      cy.get('[data-testid="presence-indicator"]').should(
        'contain',
        'collaborator'
      );

      // Mock audio system integration
      cy.intercept('POST', '/api/universes/1/audio/settings', {
        statusCode: 200,
        body: {
          settings: {
            volume: 0.8,
            effects: ['reverb'],
          },
        },
      }).as('audioSettings');

      // Configure audio
      cy.get('[data-testid="audio-settings"]').click();
      cy.get('[data-testid="master-volume"]')
        .invoke('val', 0.8)
        .trigger('change');
      cy.get('[data-testid="effect-reverb"]').click();
      cy.wait('@audioSettings');

      // Verify audio integration
      cy.get('[data-testid="audio-status"]').should('contain', 'Connected');

      // Test monitoring integration
      cy.intercept('POST', '/api/monitoring/events', {
        statusCode: 200,
      }).as('monitoringEvent');

      // Trigger monitored action
      cy.get('[data-testid="monitored-action"]').click();
      cy.wait('@monitoringEvent');

      // Verify monitoring
      cy.get('[data-testid="event-log"]').should('contain', 'Action recorded');
    });
  });

  describe('Search to Analytics Flow', () => {
    it('should handle search, interaction, and analytics tracking', () => {
      // Mock search results
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          results: [
            {
              id: 1,
              name: 'Test Universe',
              type: 'universe',
            },
          ],
        },
      }).as('search');

      // Mock analytics
      cy.intercept('POST', '/api/analytics/events', {
        statusCode: 200,
      }).as('analyticsEvent');

      // Perform search
      cy.visit('/search');
      cy.get('[data-testid="search-input"]').type('test{enter}');
      cy.wait('@search');

      // Verify search results
      cy.get('[data-testid="search-results"]').should(
        'contain',
        'Test Universe'
      );

      // Click result
      cy.get('[data-testid="result-1"]').click();

      // Verify analytics tracking
      cy.wait('@analyticsEvent');
      cy.get('[data-testid="analytics-log"]').should(
        'contain',
        'Search result clicked'
      );
    });
  });

  describe('Profile to Notification Flow', () => {
    it('should handle profile updates and notification delivery', () => {
      // Mock profile update
      cy.intercept('PUT', '/api/users/1/profile', {
        statusCode: 200,
        body: {
          message: 'Profile updated',
        },
      }).as('updateProfile');

      // Mock notification service
      cy.intercept('POST', '/api/notifications', {
        statusCode: 200,
      }).as('sendNotification');

      // Mock WebSocket for real-time notifications
      cy.window().then(win => {
        win.socketClient.on('notification', data => {
          cy.get('[data-testid="notification-toast"]').should(
            'contain',
            data.message
          );
        });
      });

      // Update profile
      cy.visit('/profile');
      cy.get('[data-testid="edit-profile"]').click();
      cy.get('[data-testid="profile-name"]').clear().type('Updated Name');
      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@updateProfile');

      // Verify notification
      cy.wait('@sendNotification');
      cy.get('[data-testid="notification-toast"]').should(
        'contain',
        'Profile updated successfully'
      );
    });
  });

  describe('Error Recovery and State Management', () => {
    it('should handle service failures and state recovery', () => {
      // Mock initial state
      cy.intercept('GET', '/api/universes/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test Universe',
          state: { version: 1 },
        },
      }).as('getUniverse');

      // Visit universe
      cy.visit('/universe/1');
      cy.wait('@getUniverse');

      // Mock service failure
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 500,
        body: {
          error: 'Service unavailable',
        },
      }).as('failedUpdate');

      // Attempt update
      cy.get('[data-testid="edit-universe"]').click();
      cy.get('[data-testid="universe-name"]').clear().type('Updated Universe');
      cy.get('[data-testid="save-universe"]').click();
      cy.wait('@failedUpdate');

      // Verify error handling
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Failed to update universe'
      );

      // Mock successful retry
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Updated Universe',
          state: { version: 2 },
        },
      }).as('successfulUpdate');

      // Retry update
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@successfulUpdate');

      // Verify state recovery
      cy.get('[data-testid="universe-name"]').should(
        'have.value',
        'Updated Universe'
      );
      cy.get('[data-testid="state-version"]').should('contain', 'Version 2');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across services', () => {
      // Mock universe data
      cy.intercept('GET', '/api/universes/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test Universe',
          collaborators: [2],
          audio_enabled: true,
        },
      }).as('getUniverse');

      // Mock collaboration data
      cy.intercept('GET', '/api/universes/1/collaborators', {
        statusCode: 200,
        body: {
          collaborators: [
            {
              id: 2,
              username: 'collaborator',
              role: 'editor',
            },
          ],
        },
      }).as('getCollaborators');

      // Mock audio state
      cy.intercept('GET', '/api/universes/1/audio', {
        statusCode: 200,
        body: {
          enabled: true,
          settings: {
            volume: 0.8,
          },
        },
      }).as('getAudioState');

      // Visit universe
      cy.visit('/universe/1');
      cy.wait(['@getUniverse', '@getCollaborators', '@getAudioState']);

      // Verify data consistency
      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Test Universe'
      );
      cy.get('[data-testid="collaborator-list"]').should(
        'contain',
        'collaborator'
      );
      cy.get('[data-testid="audio-enabled"]').should('be.visible');
      cy.get('[data-testid="volume-slider"]').should('have.value', '0.8');

      // Mock state change
      cy.intercept('PUT', '/api/universes/1/audio', {
        statusCode: 200,
        body: {
          enabled: false,
        },
      }).as('updateAudioState');

      // Update state
      cy.get('[data-testid="toggle-audio"]').click();
      cy.wait('@updateAudioState');

      // Verify consistency after update
      cy.get('[data-testid="audio-enabled"]').should('not.exist');
      cy.get('[data-testid="universe-status"]').should(
        'contain',
        'Audio disabled'
      );
    });
  });
});
