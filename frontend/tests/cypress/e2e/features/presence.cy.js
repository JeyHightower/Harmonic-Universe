describe('Presence Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock initial presence data
    cy.intercept('GET', '/api/universes/1/presence', {
      statusCode: 200,
      body: {
        activeUsers: [
          {
            id: 1,
            username: 'testuser',
            status: 'online',
            lastActive: new Date().toISOString(),
            currentActivity: 'editing',
          },
          {
            id: 2,
            username: 'collaborator',
            status: 'idle',
            lastActive: new Date().toISOString(),
            currentActivity: null,
          },
        ],
      },
    }).as('getPresence');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universes/1');
    cy.wait('@getPresence');
  });

  describe('User Presence Indicators', () => {
    it('should display active users', () => {
      cy.get('[data-testid="presence-list"]').within(() => {
        cy.get('[data-testid="user-1"]')
          .should('contain', 'testuser')
          .and('have.class', 'online');

        cy.get('[data-testid="user-2"]')
          .should('contain', 'collaborator')
          .and('have.class', 'idle');
      });
    });

    it('should update user status', () => {
      // Mock status update
      cy.intercept('PUT', '/api/presence/status', {
        statusCode: 200,
        body: {
          status: 'busy',
          message: 'In a meeting',
        },
      }).as('updateStatus');

      cy.get('[data-testid="status-selector"]').click();
      cy.get('[data-testid="status-busy"]').click();
      cy.get('[data-testid="status-message"]').type('In a meeting');
      cy.get('[data-testid="save-status"]').click();
      cy.wait('@updateStatus');

      cy.get('[data-testid="user-1"]')
        .should('have.class', 'busy')
        .and('contain', 'In a meeting');
    });
  });

  describe('Real-time Status Updates', () => {
    it('should handle user joining', () => {
      // Simulate WebSocket message for new user
      cy.window().then(win => {
        win.socketClient.emit('presence:join', {
          user: {
            id: 3,
            username: 'newuser',
            status: 'online',
          },
        });
      });

      cy.get('[data-testid="presence-list"]').should('contain', 'newuser');
    });

    it('should handle user leaving', () => {
      // Simulate WebSocket message for user leaving
      cy.window().then(win => {
        win.socketClient.emit('presence:leave', {
          userId: 2,
        });
      });

      cy.get('[data-testid="presence-list"]').should(
        'not.contain',
        'collaborator'
      );
    });
  });

  describe('Typing Indicators', () => {
    it('should show typing indicator', () => {
      // Mock typing status
      cy.intercept('POST', '/api/presence/typing', {
        statusCode: 200,
      }).as('updateTyping');

      // Trigger typing
      cy.get('[data-testid="comment-input"]').type('Hello');
      cy.wait('@updateTyping');

      cy.get('[data-testid="user-1"]').should('have.class', 'typing');
    });

    it('should handle multiple typing users', () => {
      // Simulate other user typing
      cy.window().then(win => {
        win.socketClient.emit('presence:typing', {
          user: {
            id: 2,
            username: 'collaborator',
          },
        });
      });

      cy.get('[data-testid="typing-indicator"]').should(
        'contain',
        'collaborator is typing'
      );

      // Start typing as well
      cy.get('[data-testid="comment-input"]').type('Hello');

      cy.get('[data-testid="typing-indicator"]').should(
        'contain',
        'collaborator and you are typing'
      );
    });
  });

  describe('Activity Tracking', () => {
    it('should track current activity', () => {
      cy.intercept('PUT', '/api/presence/activity', {
        statusCode: 200,
        body: {
          activity: 'viewing comments',
        },
      }).as('updateActivity');

      cy.get('[data-testid="comments-tab"]').click();
      cy.wait('@updateActivity');

      cy.get('[data-testid="user-1"]').should('contain', 'viewing comments');
    });

    it('should update last active timestamp', () => {
      const now = new Date();
      cy.intercept('PUT', '/api/presence/heartbeat', {
        statusCode: 200,
        body: {
          lastActive: now.toISOString(),
        },
      }).as('updateHeartbeat');

      // Trigger activity
      cy.get('[data-testid="universe-title"]').click();
      cy.wait('@updateHeartbeat');

      cy.get('[data-testid="user-1-last-active"]').should(
        'contain',
        'just now'
      );
    });
  });

  describe('Connection Management', () => {
    it('should handle connection loss', () => {
      // Simulate connection loss
      cy.window().then(win => {
        win.socketClient.emit('disconnect');
      });

      cy.get('[data-testid="connection-status"]')
        .should('have.class', 'disconnected')
        .and('contain', 'Reconnecting');
    });

    it('should handle reconnection', () => {
      // Simulate reconnection
      cy.window().then(win => {
        win.socketClient.emit('reconnect');
      });

      cy.get('[data-testid="connection-status"]')
        .should('have.class', 'connected')
        .and('contain', 'Connected');

      // Verify presence data is refreshed
      cy.get('[data-testid="presence-list"]').should('exist');
    });

    it('should handle idle timeout', () => {
      cy.intercept('PUT', '/api/presence/status', {
        statusCode: 200,
        body: {
          status: 'idle',
          lastActive: new Date().toISOString(),
        },
      }).as('setIdle');

      // Fast-forward time to trigger idle
      cy.clock().tick(300000); // 5 minutes
      cy.wait('@setIdle');

      cy.get('[data-testid="user-1"]').should('have.class', 'idle');
    });
  });

  describe('Error Handling', () => {
    it('should handle presence fetch errors', () => {
      cy.intercept('GET', '/api/universes/1/presence', {
        statusCode: 500,
        body: {
          error: 'Failed to fetch presence data',
        },
      }).as('presenceError');

      cy.reload();
      cy.wait('@presenceError');

      cy.get('[data-testid="presence-error"]')
        .should('be.visible')
        .and('contain', 'Failed to fetch presence data');
    });

    it('should handle status update errors', () => {
      cy.intercept('PUT', '/api/presence/status', {
        statusCode: 500,
        body: {
          error: 'Failed to update status',
        },
      }).as('statusError');

      cy.get('[data-testid="status-selector"]').click();
      cy.get('[data-testid="status-busy"]').click();
      cy.get('[data-testid="save-status"]').click();
      cy.wait('@statusError');

      cy.get('[data-testid="status-error"]')
        .should('be.visible')
        .and('contain', 'Failed to update status');
    });

    it('should handle reconnection failures', () => {
      // Simulate multiple failed reconnection attempts
      cy.window().then(win => {
        win.socketClient.emit('reconnect_failed');
      });

      cy.get('[data-testid="connection-error"]')
        .should('be.visible')
        .and('contain', 'Unable to reconnect');

      cy.get('[data-testid="manual-reconnect"]')
        .should('be.visible')
        .and('contain', 'Try again');
    });
  });
});
