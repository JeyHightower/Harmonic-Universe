describe('Real-time Collaboration', () => {
  beforeEach(() => {
    // Login as first user
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser1' },
        token: 'fake-jwt-token-1',
      },
    }).as('loginRequest1');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Collaborative Universe',
        description: 'A test universe',
        owner_id: 1,
        shared_with: [2],
      },
    }).as('getUniverse');

    // Mock WebSocket connection
    cy.intercept('GET', '/socket.io/*', req => {
      req.reply({
        statusCode: 200,
        body: { message: 'Connected' },
      });
    }).as('socketConnection');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('user1@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest1');

    cy.visit('/universe/1/edit');
    cy.wait(['@getUniverse', '@socketConnection']);
  });

  it('should handle WebSocket connections', () => {
    // Verify connection status
    cy.get('[data-testid="connection-status"]')
      .should('be.visible')
      .and('contain', 'Connected');

    // Test reconnection
    cy.window().then(win => {
      win.socketClient.emit('disconnect');
    });

    cy.get('[data-testid="connection-status"]')
      .should('contain', 'Disconnected')
      .and('have.class', 'disconnected');

    cy.window().then(win => {
      win.socketClient.emit('connect');
    });

    cy.get('[data-testid="connection-status"]')
      .should('contain', 'Connected')
      .and('have.class', 'connected');
  });

  it('should show presence indicators', () => {
    // Simulate another user joining
    cy.window().then(win => {
      win.socketClient.emit('user:joined', {
        userId: 2,
        username: 'testuser2',
        cursor: { x: 100, y: 100 },
      });
    });

    cy.get('[data-testid="presence-indicator-2"]').should('be.visible');
    cy.contains('testuser2').should('be.visible');

    // Verify cursor position
    cy.get('[data-testid="remote-cursor-2"]')
      .should('be.visible')
      .and('have.css', 'left', '100px')
      .and('have.css', 'top', '100px');

    // Simulate user leaving
    cy.window().then(win => {
      win.socketClient.emit('user:left', {
        userId: 2,
        username: 'testuser2',
      });
    });

    cy.get('[data-testid="presence-indicator-2"]').should('not.exist');
  });

  it('should handle collaborative editing', () => {
    // Make a local change
    cy.get('[data-testid="physics-panel"]').within(() => {
      cy.get('input[name="gravity"]').clear().type('5.0');
    });

    // Verify change is broadcasted
    cy.window().then(win => {
      cy.spy(win.socketClient, 'emit').as('socketEmit');
    });

    cy.get('@socketEmit').should('be.calledWith', 'physics:update');

    // Simulate receiving a change from another user
    cy.window().then(win => {
      win.socketClient.emit('physics:update', {
        userId: 2,
        username: 'testuser2',
        changes: { friction: 0.3 },
      });
    });

    cy.get('input[name="friction"]').should('have.value', '0.3');
  });

  it('should handle conflict resolution', () => {
    // Make conflicting changes
    cy.get('[data-testid="physics-panel"]').within(() => {
      cy.get('input[name="gravity"]').clear().type('5.0');
    });

    // Simulate concurrent change from another user
    cy.window().then(win => {
      win.socketClient.emit('physics:update', {
        userId: 2,
        username: 'testuser2',
        changes: { gravity: 6.0 },
        timestamp: new Date().toISOString(),
      });
    });

    // Verify conflict resolution UI
    cy.get('[data-testid="conflict-dialog"]').should('be.visible');
    cy.contains('Conflicting changes detected').should('be.visible');

    // Resolve conflict
    cy.get('[data-testid="resolve-keep-mine"]').click();
    cy.get('input[name="gravity"]').should('have.value', '5.0');
  });

  it('should handle chat functionality', () => {
    // Open chat panel
    cy.get('[data-testid="chat-toggle"]').click();
    cy.get('[data-testid="chat-panel"]').should('be.visible');

    // Send a message
    cy.get('[data-testid="chat-input"]').type('Hello everyone!{enter}');

    // Verify message is displayed and broadcasted
    cy.contains('Hello everyone!').should('be.visible');
    cy.window().then(win => {
      cy.spy(win.socketClient, 'emit').as('socketEmit');
    });
    cy.get('@socketEmit').should('be.calledWith', 'chat:message');

    // Simulate receiving a message
    cy.window().then(win => {
      win.socketClient.emit('chat:message', {
        userId: 2,
        username: 'testuser2',
        message: 'Hi there!',
        timestamp: new Date().toISOString(),
      });
    });

    cy.contains('testuser2: Hi there!').should('be.visible');
  });

  it('should handle room management', () => {
    // Create a new room
    cy.get('[data-testid="create-room"]').click();
    cy.get('input[name="room-name"]').type('Physics Discussion');
    cy.get('button[type="submit"]').click();

    // Verify room creation
    cy.get('[data-testid="room-list"]').contains('Physics Discussion');

    // Join room
    cy.get('[data-testid="room-Physics Discussion"]').click();
    cy.window().then(win => {
      cy.spy(win.socketClient, 'emit').as('socketEmit');
    });
    cy.get('@socketEmit').should('be.calledWith', 'room:join');

    // Simulate others joining the room
    cy.window().then(win => {
      win.socketClient.emit('room:joined', {
        userId: 2,
        username: 'testuser2',
        room: 'Physics Discussion',
      });
    });

    cy.get('[data-testid="room-members"]').contains('testuser2');
  });

  it('should handle change history', () => {
    // Open history panel
    cy.get('[data-testid="history-toggle"]').click();
    cy.get('[data-testid="history-panel"]').should('be.visible');

    // Make a change
    cy.get('[data-testid="physics-panel"]').within(() => {
      cy.get('input[name="gravity"]').clear().type('5.0');
    });

    // Verify change is recorded
    cy.get('[data-testid="history-list"]').within(() => {
      cy.contains('Changed gravity to 5.0').should('be.visible');
      cy.contains('testuser1').should('be.visible');
    });

    // Undo change
    cy.get('[data-testid="undo-button"]').click();
    cy.get('input[name="gravity"]').should('have.value', '9.81');

    // Redo change
    cy.get('[data-testid="redo-button"]').click();
    cy.get('input[name="gravity"]').should('have.value', '5.0');
  });

  it('should handle permissions', () => {
    // Test view-only mode
    cy.window().then(win => {
      win.socketClient.emit('permissions:update', {
        userId: 1,
        role: 'viewer',
      });
    });

    cy.get('input[name="gravity"]').should('be.disabled');
    cy.get('[data-testid="edit-controls"]').should('not.exist');

    // Test editor mode
    cy.window().then(win => {
      win.socketClient.emit('permissions:update', {
        userId: 1,
        role: 'editor',
      });
    });

    cy.get('input[name="gravity"]').should('be.enabled');
    cy.get('[data-testid="edit-controls"]').should('exist');
  });

  it('should handle activity logs', () => {
    // Open activity panel
    cy.get('[data-testid="activity-toggle"]').click();
    cy.get('[data-testid="activity-panel"]').should('be.visible');

    // Make a change
    cy.get('[data-testid="physics-panel"]').within(() => {
      cy.get('input[name="gravity"]').clear().type('5.0');
    });

    // Verify activity is logged
    cy.get('[data-testid="activity-log"]').contains('changed gravity to 5.0');

    // Simulate activity from another user
    cy.window().then(win => {
      win.socketClient.emit('activity:log', {
        userId: 2,
        username: 'testuser2',
        action: 'modified friction',
        timestamp: new Date().toISOString(),
      });
    });

    cy.get('[data-testid="activity-log"]').contains(
      'testuser2 modified friction'
    );
  });

  it('should handle error recovery', () => {
    // Simulate connection error
    cy.window().then(win => {
      win.socketClient.emit('error', {
        message: 'Connection lost',
      });
    });

    cy.get('[data-testid="error-notification"]')
      .should('be.visible')
      .and('contain', 'Connection lost');

    // Test automatic reconnection
    cy.window().then(win => {
      win.socketClient.emit('connect');
    });

    // Verify state synchronization
    cy.window().then(win => {
      cy.spy(win.socketClient, 'emit').as('socketEmit');
    });
    cy.get('@socketEmit').should('be.calledWith', 'sync:request');

    // Verify recovery notification
    cy.get('[data-testid="recovery-notification"]')
      .should('be.visible')
      .and('contain', 'Connection restored');
  });
});
