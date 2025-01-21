describe('Universe Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock universe data
    cy.intercept('GET', '/api/universes', {
      statusCode: 200,
      body: {
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            owner: { id: 1, username: 'testuser' },
            collaborators: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            isPublic: false,
          },
        ],
        total: 1,
      },
    }).as('getUniverses');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universes');
    cy.wait('@getUniverses');
  });

  describe('Universe Management', () => {
    it('should create new universe', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'New Universe',
          description: 'Brand new universe',
          owner: { id: 1, username: 'testuser' },
        },
      }).as('createUniverse');

      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="universe-name"]').type('New Universe');
      cy.get('[data-testid="universe-description"]').type('Brand new universe');
      cy.get('[data-testid="save-universe"]').click();
      cy.wait('@createUniverse');

      cy.get('[data-testid="universe-2"]').should('contain', 'New Universe');
    });

    it('should edit universe', () => {
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 200,
        body: {
          name: 'Updated Universe',
          description: 'Updated description',
        },
      }).as('updateUniverse');

      cy.get('[data-testid="edit-universe-1"]').click();
      cy.get('[data-testid="universe-name"]').clear().type('Updated Universe');
      cy.get('[data-testid="universe-description"]')
        .clear()
        .type('Updated description');
      cy.get('[data-testid="save-universe"]').click();
      cy.wait('@updateUniverse');

      cy.get('[data-testid="universe-1"]').should(
        'contain',
        'Updated Universe'
      );
    });

    it('should delete universe', () => {
      cy.intercept('DELETE', '/api/universes/1', {
        statusCode: 200,
      }).as('deleteUniverse');

      cy.get('[data-testid="delete-universe-1"]').click();
      cy.get('[data-testid="confirm-delete"]').click();
      cy.wait('@deleteUniverse');

      cy.get('[data-testid="universe-1"]').should('not.exist');
    });
  });

  describe('Universe Visualization', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/universes/1/visualization', {
        statusCode: 200,
        body: {
          nodes: [
            { id: 'node1', label: 'Node 1', type: 'entity' },
            { id: 'node2', label: 'Node 2', type: 'concept' },
          ],
          edges: [
            {
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              label: 'relates to',
            },
          ],
        },
      }).as('getVisualization');

      cy.visit('/universes/1/visualize');
      cy.wait('@getVisualization');
    });

    it('should render visualization', () => {
      cy.get('[data-testid="visualization-canvas"]').should('be.visible');
      cy.get('[data-testid="node-node1"]').should('exist');
      cy.get('[data-testid="node-node2"]').should('exist');
      cy.get('[data-testid="edge-edge1"]').should('exist');
    });

    it('should handle node interactions', () => {
      cy.intercept('PUT', '/api/universes/1/nodes/node1', {
        statusCode: 200,
        body: {
          label: 'Updated Node',
          position: { x: 100, y: 100 },
        },
      }).as('updateNode');

      cy.get('[data-testid="node-node1"]').click();
      cy.get('[data-testid="node-label"]').clear().type('Updated Node');
      cy.get('[data-testid="save-node"]').click();
      cy.wait('@updateNode');

      cy.get('[data-testid="node-node1"]').should('contain', 'Updated Node');
    });

    it('should handle edge creation', () => {
      cy.intercept('POST', '/api/universes/1/edges', {
        statusCode: 200,
        body: {
          id: 'edge2',
          source: 'node1',
          target: 'node2',
          label: 'new connection',
        },
      }).as('createEdge');

      cy.get('[data-testid="create-edge"]').click();
      cy.get('[data-testid="node-node1"]').click();
      cy.get('[data-testid="node-node2"]').click();
      cy.get('[data-testid="edge-label"]').type('new connection');
      cy.get('[data-testid="save-edge"]').click();
      cy.wait('@createEdge');

      cy.get('[data-testid="edge-edge2"]').should('exist');
    });
  });

  describe('Universe Creation Flow', () => {
    it('should handle template selection', () => {
      cy.intercept('GET', '/api/templates', {
        statusCode: 200,
        body: {
          templates: [
            {
              id: 1,
              name: 'Basic Template',
              description: 'A basic starting point',
            },
          ],
        },
      }).as('getTemplates');

      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="use-template"]').click();
      cy.wait('@getTemplates');

      cy.get('[data-testid="template-1"]').click();
      cy.get('[data-testid="universe-name"]').type('Template Universe');
      cy.get('[data-testid="create-from-template"]').click();

      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle custom creation', () => {
      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="custom-creation"]').click();

      // Step 1: Basic Info
      cy.get('[data-testid="universe-name"]').type('Custom Universe');
      cy.get('[data-testid="universe-description"]').type('Custom description');
      cy.get('[data-testid="next-step"]').click();

      // Step 2: Structure
      cy.get('[data-testid="add-entity"]').click();
      cy.get('[data-testid="entity-name"]').type('Character');
      cy.get('[data-testid="next-step"]').click();

      // Step 3: Settings
      cy.get('[data-testid="visibility-private"]').check();
      cy.get('[data-testid="create-universe"]').click();

      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Collaboration Features', () => {
    it('should invite collaborators', () => {
      cy.intercept('POST', '/api/universes/1/collaborators', {
        statusCode: 200,
        body: {
          collaborator: {
            id: 2,
            username: 'collaborator',
            role: 'editor',
          },
        },
      }).as('inviteCollaborator');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="invite-collaborator"]').click();
      cy.get('[data-testid="collaborator-email"]').type(
        'collaborator@example.com'
      );
      cy.get('[data-testid="collaborator-role"]').select('editor');
      cy.get('[data-testid="send-invite"]').click();
      cy.wait('@inviteCollaborator');

      cy.get('[data-testid="collaborator-list"]').should(
        'contain',
        'collaborator'
      );
    });

    it('should handle permission changes', () => {
      cy.intercept('PUT', '/api/universes/1/collaborators/2', {
        statusCode: 200,
        body: {
          role: 'viewer',
        },
      }).as('updatePermission');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="manage-collaborators"]').click();
      cy.get('[data-testid="collaborator-2-role"]').select('viewer');
      cy.get('[data-testid="save-permissions"]').click();
      cy.wait('@updatePermission');

      cy.get('[data-testid="collaborator-2-role"]').should(
        'have.value',
        'viewer'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 400,
        body: {
          error: 'Invalid universe name',
        },
      }).as('createError');

      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="universe-name"]').type('');
      cy.get('[data-testid="save-universe"]').click();
      cy.wait('@createError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid universe name');
    });

    it('should handle visualization errors', () => {
      cy.intercept('GET', '/api/universes/1/visualization', {
        statusCode: 500,
        body: {
          error: 'Failed to load visualization',
        },
      }).as('visualizationError');

      cy.visit('/universes/1/visualize');
      cy.wait('@visualizationError');

      cy.get('[data-testid="visualization-error"]')
        .should('be.visible')
        .and('contain', 'Failed to load visualization');
    });
  });
});
