describe('Presence', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login();
    cy.intercept('GET', '/api/universes/*', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'Test Description',
        isPublic: true,
        maxParticipants: 10,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    }).as('getUniverse');
  });

  describe('User Presence', () => {
    it('should show online status for current user', () => {
      cy.get('[data-testid="user-presence"]').should('have.class', 'online');
      cy.get('[data-testid="presence-status"]').should('contain', 'Online');
    });

    it('should show offline status when disconnected', () => {
      cy.window().then(win => {
        win.socket.disconnect();
      });
      cy.get('[data-testid="user-presence"]').should('have.class', 'offline');
      cy.get('[data-testid="presence-status"]').should('contain', 'Offline');
    });

    it('should show away status after inactivity', () => {
      cy.clock();
      cy.tick(300000); // 5 minutes
      cy.get('[data-testid="user-presence"]').should('have.class', 'away');
      cy.get('[data-testid="presence-status"]').should('contain', 'Away');
    });
  });

  describe('Collaborator Presence', () => {
    it('should show online collaborators', () => {
      cy.window().then(win => {
        win.socket.emit('presence:update', {
          userId: 2,
          username: 'collaborator1',
          status: 'online',
        });
      });
      cy.get('[data-testid="collaborator-list"]').should('be.visible');
      cy.get('[data-testid="collaborator-2"]').should('have.class', 'online');
    });

    it('should update collaborator status in real-time', () => {
      cy.window().then(win => {
        win.socket.emit('presence:update', {
          userId: 2,
          username: 'collaborator1',
          status: 'away',
        });
      });
      cy.get('[data-testid="collaborator-2"]').should('have.class', 'away');
    });

    it('should remove offline collaborators after timeout', () => {
      cy.window().then(win => {
        win.socket.emit('presence:update', {
          userId: 2,
          username: 'collaborator1',
          status: 'offline',
        });
      });
      cy.clock();
      cy.tick(60000); // 1 minute
      cy.get('[data-testid="collaborator-2"]').should('not.exist');
    });
  });

  describe('Presence Indicators', () => {
    it('should show cursor position for collaborators', () => {
      cy.window().then(win => {
        win.socket.emit('presence:cursor', {
          userId: 2,
          username: 'collaborator1',
          position: { x: 100, y: 100 },
        });
      });
      cy.get('[data-testid="cursor-2"]')
        .should('be.visible')
        .and('have.css', 'transform', 'translate(100px, 100px)');
    });

    it('should show selection range for collaborators', () => {
      cy.window().then(win => {
        win.socket.emit('presence:selection', {
          userId: 2,
          username: 'collaborator1',
          range: { start: 0, end: 10 },
        });
      });
      cy.get('[data-testid="selection-2"]').should('be.visible');
    });

    it('should remove cursor when collaborator leaves', () => {
      cy.window().then(win => {
        win.socket.emit('presence:leave', {
          userId: 2,
          username: 'collaborator1',
        });
      });
      cy.get('[data-testid="cursor-2"]').should('not.exist');
    });
  });

  describe('Connection Management', () => {
    it('should handle reconnection gracefully', () => {
      cy.window().then(win => {
        win.socket.disconnect();
        win.socket.connect();
      });
      cy.get('[data-testid="user-presence"]').should('have.class', 'online');
    });

    it('should sync presence state after reconnection', () => {
      cy.window().then(win => {
        win.socket.disconnect();
        cy.clock();
        cy.tick(5000);
        win.socket.connect();
      });
      cy.get('[data-testid="collaborator-list"]').should('be.visible');
    });

    it('should show connection status indicator', () => {
      cy.get('[data-testid="connection-status"]').should(
        'contain',
        'Connected'
      );
      cy.window().then(win => {
        win.socket.disconnect();
      });
      cy.get('[data-testid="connection-status"]').should(
        'contain',
        'Disconnected'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle presence update errors', () => {
      cy.intercept('POST', '/api/presence/update', {
        statusCode: 500,
        body: { error: 'Failed to update presence' },
      }).as('updatePresence');
      cy.get('[data-testid="presence-error"]').should('be.visible');
    });

    it('should retry failed presence updates', () => {
      cy.intercept('POST', '/api/presence/update', {
        statusCode: 500,
        body: { error: 'Failed to update presence' },
      }).as('updatePresenceFail');
      cy.clock();
      cy.tick(5000);
      cy.get('@updatePresenceFail.all').should('have.length.gt', 1);
    });

    it('should handle websocket errors gracefully', () => {
      cy.window().then(win => {
        win.socket.emit('error', new Error('WebSocket error'));
      });
      cy.get('[data-testid="websocket-error"]').should('be.visible');
      cy.get('[data-testid="retry-connection"]').should('exist');
    });
  });
});
