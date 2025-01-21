describe('Sharing & Collaboration Features', () => {
  beforeEach(() => {
    // Mock login
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
        name: 'Test Universe',
        description: 'A test universe',
        owner: { id: 1, username: 'testuser' },
        collaborators: [
          {
            id: 2,
            username: 'collaborator1',
            role: 'editor',
            joined_at: '2024-01-15T12:00:00Z',
          },
        ],
        shared_with: [
          {
            id: 3,
            username: 'viewer1',
            role: 'viewer',
            shared_at: '2024-01-10T12:00:00Z',
          },
        ],
        public: false,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-20T12:00:00Z',
      },
    }).as('getUniverse');

    // Mock collaboration session
    cy.intercept('GET', '/api/universes/1/session', {
      statusCode: 200,
      body: {
        session_id: 'test-session',
        active_users: [
          {
            id: 1,
            username: 'testuser',
            cursor: { x: 100, y: 100 },
            last_active: '2024-01-20T12:00:00Z',
          },
          {
            id: 2,
            username: 'collaborator1',
            cursor: { x: 200, y: 200 },
            last_active: '2024-01-20T12:00:00Z',
          },
        ],
      },
    }).as('getSession');

    // Mock WebSocket connection
    cy.intercept('GET', '/api/ws', {
      statusCode: 101,
    }).as('wsConnection');

    // Login and navigate
    cy.login();
    cy.visit('/universes/1/edit');
    cy.wait(['@getUniverse', '@getSession', '@wsConnection']);
  });

  describe('Sharing Settings', () => {
    it('should display sharing settings', () => {
      cy.get('[data-testid="sharing-settings"]').click();

      // Collaborators list
      cy.get('[data-testid="collaborators-list"]').within(() => {
        cy.get('[data-testid="collaborator-2"]')
          .should('contain', 'collaborator1')
          .and('contain', 'editor');
      });

      // Viewers list
      cy.get('[data-testid="viewers-list"]').within(() => {
        cy.get('[data-testid="viewer-3"]')
          .should('contain', 'viewer1')
          .and('contain', 'viewer');
      });

      // Privacy setting
      cy.get('[data-testid="privacy-toggle"]')
        .should('not.be.checked')
        .and('contain', 'Private');
    });

    it('should add collaborator', () => {
      cy.intercept('POST', '/api/universes/1/collaborators', {
        statusCode: 201,
        body: {
          id: 4,
          username: 'newcollaborator',
          role: 'editor',
          joined_at: '2024-01-20T13:00:00Z',
        },
      }).as('addCollaborator');

      cy.get('[data-testid="sharing-settings"]').click();
      cy.get('[data-testid="add-collaborator"]').click();
      cy.get('[data-testid="collaborator-username"]').type('newcollaborator');
      cy.get('[data-testid="collaborator-role"]').select('editor');
      cy.get('[data-testid="submit-collaborator"]').click();

      cy.wait('@addCollaborator');
      cy.get('[data-testid="collaborator-4"]')
        .should('contain', 'newcollaborator')
        .and('contain', 'editor');
    });

    it('should update collaborator role', () => {
      cy.intercept('PUT', '/api/universes/1/collaborators/2', {
        statusCode: 200,
        body: {
          id: 2,
          username: 'collaborator1',
          role: 'viewer',
          joined_at: '2024-01-15T12:00:00Z',
        },
      }).as('updateCollaborator');

      cy.get('[data-testid="sharing-settings"]').click();
      cy.get('[data-testid="collaborator-2"]')
        .find('[data-testid="role-select"]')
        .select('viewer');

      cy.wait('@updateCollaborator');
      cy.get('[data-testid="collaborator-2"]').should('contain', 'viewer');
    });

    it('should remove collaborator', () => {
      cy.intercept('DELETE', '/api/universes/1/collaborators/2', {
        statusCode: 204,
      }).as('removeCollaborator');

      cy.get('[data-testid="sharing-settings"]').click();
      cy.get('[data-testid="collaborator-2"]')
        .find('[data-testid="remove-collaborator"]')
        .click();

      cy.wait('@removeCollaborator');
      cy.get('[data-testid="collaborator-2"]').should('not.exist');
    });

    it('should toggle privacy setting', () => {
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 200,
        body: {
          public: true,
        },
      }).as('updatePrivacy');

      cy.get('[data-testid="sharing-settings"]').click();
      cy.get('[data-testid="privacy-toggle"]').click();

      cy.wait('@updatePrivacy');
      cy.get('[data-testid="privacy-toggle"]')
        .should('be.checked')
        .and('contain', 'Public');
    });
  });

  describe('Real-time Collaboration', () => {
    it('should display active users', () => {
      cy.get('[data-testid="active-users"]').within(() => {
        cy.get('[data-testid="user-1"]')
          .should('contain', 'testuser')
          .and('have.class', 'active');
        cy.get('[data-testid="user-2"]')
          .should('contain', 'collaborator1')
          .and('have.class', 'active');
      });
    });

    it('should handle cursor tracking', () => {
      // Mock WebSocket message for cursor update
      cy.window().then(win => {
        win.postMessage(
          {
            type: 'cursor_update',
            data: {
              user_id: 2,
              cursor: { x: 300, y: 300 },
            },
          },
          '*'
        );
      });

      cy.get('[data-testid="remote-cursor-2"]').should(
        'have.css',
        'transform',
        'translate(300px, 300px)'
      );
    });

    it('should handle concurrent edits', () => {
      // Mock WebSocket message for remote edit
      cy.window().then(win => {
        win.postMessage(
          {
            type: 'universe_update',
            data: {
              user_id: 2,
              changes: {
                name: 'Updated Universe',
              },
            },
          },
          '*'
        );
      });

      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Updated Universe'
      );
    });

    it('should handle conflict resolution', () => {
      // Simulate conflicting edit
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 409,
        body: {
          error: 'Conflict detected',
          current_version: {
            name: 'Remote Update',
            updated_at: '2024-01-20T13:00:00Z',
          },
        },
      }).as('conflictError');

      cy.get('[data-testid="universe-name"]').clear().type('Local Update');
      cy.get('[data-testid="save-changes"]').click();

      cy.wait('@conflictError');
      cy.get('[data-testid="conflict-dialog"]').should('be.visible');
      cy.get('[data-testid="conflict-current"]').should(
        'contain',
        'Remote Update'
      );
      cy.get('[data-testid="conflict-incoming"]').should(
        'contain',
        'Local Update'
      );

      // Resolve conflict
      cy.get('[data-testid="resolve-conflict"]').click();
      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Remote Update'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle sharing errors', () => {
      // Invalid collaborator
      cy.intercept('POST', '/api/universes/1/collaborators', {
        statusCode: 404,
        body: {
          error: 'User not found',
        },
      }).as('collaboratorError');

      cy.get('[data-testid="sharing-settings"]').click();
      cy.get('[data-testid="add-collaborator"]').click();
      cy.get('[data-testid="collaborator-username"]').type('nonexistent');
      cy.get('[data-testid="submit-collaborator"]').click();

      cy.wait('@collaboratorError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'User not found'
      );
    });

    it('should handle connection errors', () => {
      // Simulate WebSocket disconnection
      cy.window().then(win => {
        win.postMessage(
          {
            type: 'connection_error',
            data: {
              error: 'Connection lost',
            },
          },
          '*'
        );
      });

      cy.get('[data-testid="connection-error"]')
        .should('be.visible')
        .and('contain', 'Connection lost');

      // Simulate reconnection
      cy.window().then(win => {
        win.postMessage(
          {
            type: 'connection_restored',
            data: {
              message: 'Connection restored',
            },
          },
          '*'
        );
      });

      cy.get('[data-testid="connection-error"]').should('not.exist');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Connection restored'
      );
    });

    it('should handle permission errors', () => {
      // Attempt to edit without permission
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 403,
        body: {
          error: 'Insufficient permissions',
        },
      }).as('permissionError');

      cy.get('[data-testid="universe-name"]')
        .clear()
        .type('Unauthorized Update');
      cy.get('[data-testid="save-changes"]').click();

      cy.wait('@permissionError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Insufficient permissions'
      );
    });
  });
});
