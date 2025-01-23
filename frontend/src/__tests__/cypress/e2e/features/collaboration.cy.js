describe('Collaboration Features', () => {
  beforeEach(() => {
    // Mock authentication for first user
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'user1' },
        token: 'fake-jwt-token-1',
      },
    }).as('loginRequest');

    // Mock WebSocket connection
    cy.intercept('GET', '/api/collaboration/connect', {
      statusCode: 200,
      body: {
        sessionId: 'test-session',
        userId: 1,
        universeId: 1,
      },
    }).as('wsConnect');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'Test Description',
        sharedWith: [2, 3],
        version: 1,
      },
    }).as('getUniverse');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('user1@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universe/1');
    cy.wait(['@wsConnect', '@getUniverse']);
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection', () => {
      cy.window().then(win => {
        expect(win.collaborationSocket).to.exist;
        expect(win.collaborationSocket.readyState).to.equal(1); // OPEN
      });

      cy.get('[data-testid="connection-status"]')
        .should('have.class', 'connected')
        .and('contain', 'Connected');
    });

    it('should handle reconnection', () => {
      cy.intercept('GET', '/api/collaboration/reconnect', {
        statusCode: 200,
        body: {
          sessionId: 'new-session',
          userId: 1,
          universeId: 1,
        },
      }).as('wsReconnect');

      // Simulate connection loss
      cy.window().then(win => {
        win.collaborationSocket.close();
      });

      cy.get('[data-testid="connection-status"]')
        .should('have.class', 'reconnecting')
        .and('contain', 'Reconnecting');

      cy.wait('@wsReconnect');

      cy.get('[data-testid="connection-status"]')
        .should('have.class', 'connected')
        .and('contain', 'Connected');
    });
  });

  describe('User Presence', () => {
    it('should show active users', () => {
      // Mock presence data
      cy.intercept('GET', '/api/collaboration/1/presence', {
        statusCode: 200,
        body: {
          users: [
            { id: 1, username: 'user1', status: 'active' },
            { id: 2, username: 'user2', status: 'active' },
          ],
        },
      }).as('getPresence');

      cy.get('[data-testid="presence-list"]').within(() => {
        cy.contains('user1').should('have.class', 'active');
        cy.contains('user2').should('have.class', 'active');
      });
    });

    it('should update user status', () => {
      // Simulate user2 going idle
      cy.window().then(win => {
        win.collaborationSocket.onmessage({
          data: JSON.stringify({
            type: 'presence',
            userId: 2,
            status: 'idle',
          }),
        });
      });

      cy.get('[data-testid="presence-list"]').within(() => {
        cy.contains('user2').should('have.class', 'idle');
      });
    });
  });

  describe('Real-time Editing', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/collaboration/1/changes', {
        statusCode: 200,
        body: {
          id: 'change-1',
          type: 'update',
          path: ['name'],
          value: 'Updated Universe',
        },
      }).as('saveChanges');
    });

    it('should broadcast changes', () => {
      // Make a change
      cy.get('[data-testid="universe-name"]').clear().type('Updated Universe');
      cy.wait('@saveChanges');

      // Verify change is broadcast
      cy.window().then(win => {
        expect(win.collaborationSocket.send).to.be.calledWith(
          JSON.stringify({
            type: 'change',
            change: {
              type: 'update',
              path: ['name'],
              value: 'Updated Universe',
            },
          })
        );
      });
    });

    it('should receive changes', () => {
      // Simulate receiving change from another user
      cy.window().then(win => {
        win.collaborationSocket.onmessage({
          data: JSON.stringify({
            type: 'change',
            userId: 2,
            change: {
              type: 'update',
              path: ['description'],
              value: 'Updated Description',
            },
          }),
        });
      });

      cy.get('[data-testid="universe-description"]').should(
        'have.value',
        'Updated Description'
      );
    });

    it('should handle concurrent edits', () => {
      // Simulate concurrent edits
      cy.get('[data-testid="universe-name"]').clear().type('Local Change');

      cy.window().then(win => {
        win.collaborationSocket.onmessage({
          data: JSON.stringify({
            type: 'change',
            userId: 2,
            change: {
              type: 'update',
              path: ['name'],
              value: 'Remote Change',
            },
          }),
        });
      });

      // Verify conflict resolution
      cy.get('[data-testid="conflict-dialog"]').should('be.visible');
      cy.get('[data-testid="resolve-local"]').click();

      cy.get('[data-testid="universe-name"]').should(
        'have.value',
        'Local Change'
      );
    });
  });

  describe('Chat System', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/collaboration/1/messages', {
        statusCode: 200,
        body: {
          messages: [
            { id: 1, userId: 2, text: 'Hello', timestamp: Date.now() - 1000 },
          ],
        },
      }).as('getMessages');

      cy.intercept('POST', '/api/collaboration/1/messages', {
        statusCode: 200,
        body: {
          id: 2,
          userId: 1,
          text: 'Hi there',
          timestamp: Date.now(),
        },
      }).as('sendMessage');
    });

    it('should load chat history', () => {
      cy.get('[data-testid="chat-toggle"]').click();
      cy.wait('@getMessages');

      cy.get('[data-testid="chat-messages"]').should('contain', 'Hello');
    });

    it('should send messages', () => {
      cy.get('[data-testid="chat-toggle"]').click();
      cy.get('[data-testid="chat-input"]').type('Hi there{enter}');
      cy.wait('@sendMessage');

      cy.get('[data-testid="chat-messages"]').should('contain', 'Hi there');
    });

    it('should receive messages', () => {
      cy.get('[data-testid="chat-toggle"]').click();

      // Simulate receiving message
      cy.window().then(win => {
        win.collaborationSocket.onmessage({
          data: JSON.stringify({
            type: 'chat',
            message: {
              id: 3,
              userId: 2,
              text: 'New message',
              timestamp: Date.now(),
            },
          }),
        });
      });

      cy.get('[data-testid="chat-messages"]').should('contain', 'New message');
    });
  });

  describe('Version Control', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/universes/1/versions', {
        statusCode: 200,
        body: {
          versions: [
            {
              id: 1,
              timestamp: Date.now() - 1000,
              changes: ['Initial version'],
            },
            { id: 2, timestamp: Date.now(), changes: ['Updated name'] },
          ],
        },
      }).as('getVersions');

      cy.intercept('POST', '/api/universes/1/versions', {
        statusCode: 200,
        body: {
          id: 3,
          timestamp: Date.now(),
          changes: ['New version'],
        },
      }).as('createVersion');
    });

    it('should create version', () => {
      cy.get('[data-testid="create-version"]').click();
      cy.get('[data-testid="version-message"]').type('New version');
      cy.get('[data-testid="save-version"]').click();
      cy.wait('@createVersion');

      cy.get('[data-testid="version-list"]').should('contain', 'New version');
    });

    it('should restore version', () => {
      cy.intercept('POST', '/api/universes/1/restore', {
        statusCode: 200,
        body: {
          success: true,
          version: 1,
        },
      }).as('restoreVersion');

      cy.get('[data-testid="version-list"]').click();
      cy.get('[data-testid="version-1"]').click();
      cy.get('[data-testid="restore-version"]').click();
      cy.wait('@restoreVersion');

      cy.get('[data-testid="version-status"]').should(
        'contain',
        'Version 1 restored'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      cy.intercept('GET', '/api/collaboration/connect', {
        statusCode: 500,
        body: {
          error: 'Failed to connect',
        },
      }).as('connectError');

      cy.reload();
      cy.wait('@connectError');

      cy.get('[data-testid="connection-error"]')
        .should('be.visible')
        .and('contain', 'Failed to connect');
    });

    it('should handle change errors', () => {
      cy.intercept('POST', '/api/collaboration/1/changes', {
        statusCode: 500,
        body: {
          error: 'Failed to save changes',
        },
      }).as('changeError');

      cy.get('[data-testid="universe-name"]').clear().type('Test Change');
      cy.wait('@changeError');

      cy.get('[data-testid="change-error"]')
        .should('be.visible')
        .and('contain', 'Failed to save changes');
    });

    it('should handle version control errors', () => {
      cy.intercept('POST', '/api/universes/1/versions', {
        statusCode: 500,
        body: {
          error: 'Failed to create version',
        },
      }).as('versionError');

      cy.get('[data-testid="create-version"]').click();
      cy.get('[data-testid="version-message"]').type('New version');
      cy.get('[data-testid="save-version"]').click();
      cy.wait('@versionError');

      cy.get('[data-testid="version-error"]')
        .should('be.visible')
        .and('contain', 'Failed to create version');
    });
  });
});
