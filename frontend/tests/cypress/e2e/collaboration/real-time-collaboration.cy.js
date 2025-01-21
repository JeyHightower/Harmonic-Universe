describe('Real-time Collaboration', () => {
  beforeEach(() => {
    // Login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Collaborative Universe',
        description: 'A test universe for collaboration',
        owner_id: 1,
        shared_with: [
          {
            user_id: 2,
            username: 'collaborator',
            permission: 'edit',
          },
        ],
      },
    }).as('getUniverse');

    // Mock collaboration session
    cy.intercept('GET', '/api/universes/1/collaboration', {
      statusCode: 200,
      body: {
        session_id: 'test-session',
        active_users: [
          {
            id: 1,
            username: 'testuser',
            cursor: { x: 100, y: 100 },
            selection: null,
          },
          {
            id: 2,
            username: 'collaborator',
            cursor: { x: 200, y: 200 },
            selection: { start: 10, end: 20 },
          },
        ],
      },
    }).as('getCollaboration');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universe/1/collaborate');
    cy.wait(['@getUniverse', '@getCollaboration']);
  });

  it('should handle user presence', () => {
    // Check presence indicators
    cy.get('[data-testid="presence-panel"]').should('be.visible');
    cy.get('[data-testid="active-users"]').within(() => {
      cy.contains('testuser').should('be.visible');
      cy.contains('collaborator').should('be.visible');
    });

    // Simulate new user joining
    cy.window().then(win => {
      win.socketClient.emit('user:join', {
        user_id: 3,
        username: 'newuser',
        cursor: { x: 300, y: 300 },
      });
    });

    cy.get('[data-testid="active-users"]').should('contain', 'newuser');

    // Simulate user leaving
    cy.window().then(win => {
      win.socketClient.emit('user:leave', {
        user_id: 2,
      });
    });

    cy.get('[data-testid="active-users"]').should(
      'not.contain',
      'collaborator'
    );
  });

  it('should handle collaborative editing', () => {
    // Start editing
    cy.get('[data-testid="physics-params"]').click();
    cy.get('[data-testid="gravity"]').clear().type('5.0');

    // Verify local change
    cy.get('[data-testid="gravity"]').should('have.value', '5.0');

    // Simulate remote change
    cy.window().then(win => {
      win.socketClient.emit('change:physics', {
        user_id: 2,
        params: {
          friction: 0.8,
        },
      });
    });

    // Verify remote change applied
    cy.get('[data-testid="friction"]').should('have.value', '0.8');

    // Test conflict resolution
    cy.window().then(win => {
      win.socketClient.emit('change:physics', {
        user_id: 2,
        params: {
          gravity: 9.81,
        },
        timestamp: Date.now(),
      });
    });

    // Verify conflict dialog
    cy.get('[data-testid="conflict-dialog"]').should('be.visible');
    cy.get('[data-testid="resolve-conflict"]').click();
    cy.get('[data-testid="keep-remote"]').click();

    cy.get('[data-testid="gravity"]').should('have.value', '9.81');
  });

  it('should handle cursor tracking', () => {
    // Move cursor
    cy.get('[data-testid="canvas"]').trigger('mousemove', {
      clientX: 150,
      clientY: 150,
    });

    // Verify cursor broadcast
    cy.window().then(win => {
      expect(win.socketClient.lastEmitted).to.deep.equal({
        event: 'cursor:move',
        data: {
          x: 150,
          y: 150,
        },
      });
    });

    // Simulate remote cursor movement
    cy.window().then(win => {
      win.socketClient.emit('cursor:update', {
        user_id: 2,
        cursor: { x: 250, y: 250 },
      });
    });

    // Verify remote cursor displayed
    cy.get('[data-testid="remote-cursor-2"]')
      .should('have.css', 'left', '250px')
      .and('have.css', 'top', '250px');
  });

  it('should handle chat functionality', () => {
    // Open chat
    cy.get('[data-testid="chat-panel"]').click();

    // Send message
    cy.get('[data-testid="chat-input"]').type('Hello, team!{enter}');

    // Verify message sent
    cy.get('[data-testid="chat-messages"]')
      .should('contain', 'Hello, team!')
      .and('contain', 'testuser');

    // Simulate receiving message
    cy.window().then(win => {
      win.socketClient.emit('chat:message', {
        user_id: 2,
        username: 'collaborator',
        message: 'Hi there!',
        timestamp: new Date().toISOString(),
      });
    });

    // Verify received message
    cy.get('[data-testid="chat-messages"]')
      .should('contain', 'Hi there!')
      .and('contain', 'collaborator');

    // Test message notifications
    cy.get('[data-testid="chat-panel"]').click(); // Close chat
    cy.window().then(win => {
      win.socketClient.emit('chat:message', {
        user_id: 2,
        username: 'collaborator',
        message: 'New message',
      });
    });

    cy.get('[data-testid="chat-notification"]')
      .should('be.visible')
      .and('contain', '1');
  });

  it('should handle conflict resolution', () => {
    // Make local change
    cy.get('[data-testid="audio-params"]').click();
    cy.get('[data-testid="harmony"]').clear().type('0.8');

    // Simulate concurrent remote change
    cy.window().then(win => {
      win.socketClient.emit('change:audio', {
        user_id: 2,
        params: {
          harmony: 0.6,
        },
        timestamp: Date.now() + 1000, // Later timestamp
      });
    });

    // Verify conflict detection
    cy.get('[data-testid="conflict-dialog"]').should('be.visible');

    // Test conflict resolution options
    cy.get('[data-testid="conflict-dialog"]').within(() => {
      cy.get('[data-testid="local-value"]').should('contain', '0.8');
      cy.get('[data-testid="remote-value"]').should('contain', '0.6');

      // Choose remote value
      cy.get('[data-testid="keep-remote"]').click();
    });

    // Verify resolution
    cy.get('[data-testid="harmony"]').should('have.value', '0.6');
  });

  it('should handle permissions and roles', () => {
    // Test view-only mode
    cy.window().then(win => {
      win.socketClient.emit('permission:update', {
        user_id: 1,
        permission: 'view',
      });
    });

    // Verify edit controls disabled
    cy.get('[data-testid="physics-params"]').should('have.class', 'disabled');
    cy.get('[data-testid="audio-params"]').should('have.class', 'disabled');

    // Test editor mode
    cy.window().then(win => {
      win.socketClient.emit('permission:update', {
        user_id: 1,
        permission: 'edit',
      });
    });

    // Verify edit controls enabled
    cy.get('[data-testid="physics-params"]').should(
      'not.have.class',
      'disabled'
    );
    cy.get('[data-testid="audio-params"]').should('not.have.class', 'disabled');
  });

  it('should handle room management', () => {
    // Create room
    cy.get('[data-testid="create-room"]').click();
    cy.get('[data-testid="room-name"]').type('Physics Discussion');
    cy.get('[data-testid="create-room-submit"]').click();

    // Verify room created
    cy.get('[data-testid="rooms-list"]').should(
      'contain',
      'Physics Discussion'
    );

    // Join room
    cy.get('[data-testid="room-physics"]').click();
    cy.get('[data-testid="room-members"]').should('contain', 'testuser');

    // Simulate other user joining
    cy.window().then(win => {
      win.socketClient.emit('room:join', {
        user_id: 2,
        username: 'collaborator',
        room: 'physics',
      });
    });

    cy.get('[data-testid="room-members"]').should('contain', 'collaborator');

    // Leave room
    cy.get('[data-testid="leave-room"]').click();
    cy.get('[data-testid="room-physics"]').should('not.have.class', 'active');
  });

  it('should handle activity logs', () => {
    // Open activity panel
    cy.get('[data-testid="activity-panel"]').click();

    // Verify initial activities
    cy.get('[data-testid="activity-log"]').within(() => {
      cy.contains('testuser joined').should('be.visible');
      cy.contains('collaborator joined').should('be.visible');
    });

    // Perform action
    cy.get('[data-testid="physics-params"]').click();
    cy.get('[data-testid="gravity"]').clear().type('5.0');
    cy.get('[data-testid="save-physics"]').click();

    // Verify action logged
    cy.get('[data-testid="activity-log"]').should(
      'contain',
      'testuser updated physics parameters'
    );

    // Simulate remote action
    cy.window().then(win => {
      win.socketClient.emit('activity:log', {
        user_id: 2,
        username: 'collaborator',
        action: 'updated audio parameters',
        timestamp: new Date().toISOString(),
      });
    });

    // Verify remote action logged
    cy.get('[data-testid="activity-log"]').should(
      'contain',
      'collaborator updated audio parameters'
    );
  });

  it('should handle disconnection and reconnection', () => {
    // Simulate disconnection
    cy.window().then(win => {
      win.socketClient.emit('disconnect');
    });

    // Verify disconnection state
    cy.get('[data-testid="connection-status"]').should(
      'contain',
      'Disconnected'
    );
    cy.get('[data-testid="reconnect-button"]').should('be.visible');

    // Test auto-reconnect
    cy.window().then(win => {
      win.socketClient.emit('reconnect');
    });

    // Verify reconnection
    cy.get('[data-testid="connection-status"]').should('contain', 'Connected');

    // Verify state synchronization
    cy.get('[data-testid="sync-status"]').should('contain', 'Synchronized');
  });
});
