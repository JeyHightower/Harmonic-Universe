describe('Collaboration Edge Cases', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser1' },
        token: 'fake-jwt-token-1',
      },
    }).as('loginRequest');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'Test Description',
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
    cy.wait('@loginRequest');

    cy.visit('/universe/1/edit');
    cy.wait(['@getUniverse', '@socketConnection']);
  });

  describe('Connection Edge Cases', () => {
    it('should handle rapid reconnection attempts', () => {
      // Simulate multiple rapid disconnections
      for (let i = 0; i < 5; i++) {
        cy.window().then(win => {
          win.socketClient.emit('disconnect');
          win.socketClient.emit('connect');
        });
      }

      // Verify connection status remains stable
      cy.get('[data-testid="connection-status"]')
        .should('be.visible')
        .and('contain', 'Connected');
    });

    it('should handle connection timeout', () => {
      // Simulate connection timeout
      cy.window().then(win => {
        win.socketClient.emit('connect_timeout');
      });

      // Verify timeout message
      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .and('contain', 'Connection timed out');

      // Verify automatic retry
      cy.get('[data-testid="retry-connection"]').should('be.visible').click();

      cy.get('[data-testid="connection-status"]')
        .should('be.visible')
        .and('contain', 'Connected');
    });

    it('should handle invalid auth token during reconnection', () => {
      // Simulate invalid token error
      cy.window().then(win => {
        win.socketClient.emit('error', {
          type: 'auth',
          message: 'Invalid token',
        });
      });

      // Verify user is redirected to login
      cy.url().should('include', '/login');
    });
  });

  describe('Concurrent Edit Edge Cases', () => {
    it('should handle rapid parameter changes', () => {
      // Simulate rapid parameter changes from multiple users
      const changes = [
        { userId: 2, parameter: 'gravity', value: 5.0 },
        { userId: 3, parameter: 'gravity', value: 6.0 },
        { userId: 1, parameter: 'gravity', value: 7.0 },
      ];

      changes.forEach(change => {
        cy.window().then(win => {
          win.socketClient.emit('parameter_changed', change);
        });
      });

      // Verify final state is consistent
      cy.get('input[name="gravity"]').should('have.value', '7.0');
    });

    it('should handle conflicting parameter updates', () => {
      // Make local change
      cy.get('input[name="gravity"]').clear().type('5.0');

      // Simulate concurrent remote changes
      cy.window().then(win => {
        win.socketClient.emit('parameter_changed', {
          userId: 2,
          parameter: 'gravity',
          value: 6.0,
          timestamp: Date.now(),
        });
      });

      // Verify conflict resolution dialog
      cy.get('[data-testid="conflict-dialog"]').should('be.visible');
      cy.get('[data-testid="conflict-local-value"]').should('contain', '5.0');
      cy.get('[data-testid="conflict-remote-value"]').should('contain', '6.0');

      // Resolve conflict
      cy.get('[data-testid="resolve-remote"]').click();
      cy.get('input[name="gravity"]').should('have.value', '6.0');
    });
  });

  describe('Room Management Edge Cases', () => {
    it('should handle room capacity limits', () => {
      // Simulate room at capacity
      cy.window().then(win => {
        win.socketClient.emit('room_error', {
          type: 'capacity',
          message: 'Room is at capacity',
        });
      });

      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .and('contain', 'Room is at capacity');
    });

    it('should handle invalid room tokens', () => {
      // Attempt to join with invalid token
      cy.window().then(win => {
        win.socketClient.emit('join_room', {
          room_token: 'invalid-token',
          user_id: 1,
        });
      });

      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .and('contain', 'Invalid room token');
    });
  });

  describe('State Synchronization Edge Cases', () => {
    it('should handle version conflicts during sync', () => {
      // Simulate version conflict
      cy.window().then(win => {
        win.socketClient.emit('sync_error', {
          type: 'version_conflict',
          server_version: 2,
          client_version: 1,
        });
      });

      // Verify version conflict resolution
      cy.get('[data-testid="sync-dialog"]').should('be.visible');
      cy.get('[data-testid="sync-reload"]').click();

      // Verify state is updated
      cy.get('[data-testid="universe-version"]').should('contain', '2');
    });

    it('should handle partial state updates', () => {
      // Simulate partial state update
      cy.window().then(win => {
        win.socketClient.emit('partial_state', {
          gravity: 5.0,
          // friction missing
        });
      });

      // Verify partial update handling
      cy.get('input[name="gravity"]').should('have.value', '5.0');
      cy.get('input[name="friction"]').should('have.value', '0.5'); // Default value
    });
  });

  describe('Resource Management', () => {
    it('should handle memory cleanup on room switch', () => {
      // Join first room
      cy.get('[data-testid="room-1"]').click();

      // Switch to second room
      cy.get('[data-testid="room-2"]').click();

      // Verify first room resources are cleaned up
      cy.window().then(win => {
        const room1 = win.collaborationService.activeRooms.get('room-1');
        expect(room1).to.be.undefined;
      });
    });

    it('should handle websocket reconnection with large state', () => {
      // Simulate large state
      cy.window().then(win => {
        const largeState = Array(1000)
          .fill()
          .map((_, i) => ({
            id: i,
            value: `value-${i}`,
          }));
        win.socketClient.emit('state_update', { state: largeState });
      });

      // Simulate disconnection and reconnection
      cy.window().then(win => {
        win.socketClient.emit('disconnect');
        win.socketClient.emit('connect');
      });

      // Verify state is preserved
      cy.get('[data-testid="state-size"]').should('contain', '1000');
    });
  });
});
