describe('Universe Management Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock universes list
    cy.intercept('GET', '/api/universes', {
      statusCode: 200,
      body: {
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'Test Description',
            owner: 1,
            sharedWith: [],
            createdAt: Date.now() - 1000,
            updatedAt: Date.now(),
          },
        ],
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

  describe('Universe Listing', () => {
    it('should display universe list', () => {
      cy.get('[data-testid="universe-list"]')
        .should('be.visible')
        .and('contain', 'Test Universe');

      cy.get('[data-testid="universe-1"]').within(() => {
        cy.get('[data-testid="universe-name"]').should(
          'contain',
          'Test Universe'
        );
        cy.get('[data-testid="universe-description"]').should(
          'contain',
          'Test Description'
        );
      });
    });

    it('should handle empty state', () => {
      cy.intercept('GET', '/api/universes', {
        statusCode: 200,
        body: {
          universes: [],
        },
      }).as('getEmptyUniverses');

      cy.reload();
      cy.wait('@getEmptyUniverses');

      cy.get('[data-testid="empty-state"]')
        .should('be.visible')
        .and('contain', 'No universes found');
    });
  });

  describe('Universe Creation', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'New Universe',
          description: 'New Description',
          owner: 1,
          sharedWith: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      }).as('createUniverse');
    });

    it('should create new universe', () => {
      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="universe-name-input"]').type('New Universe');
      cy.get('[data-testid="universe-description-input"]').type(
        'New Description'
      );
      cy.get('[data-testid="submit-universe"]').click();
      cy.wait('@createUniverse');

      cy.get('[data-testid="universe-list"]').should('contain', 'New Universe');
    });

    it('should use template for creation', () => {
      cy.intercept('GET', '/api/templates', {
        statusCode: 200,
        body: {
          templates: [
            {
              id: 1,
              name: 'Basic Template',
              description: 'A basic universe template',
            },
          ],
        },
      }).as('getTemplates');

      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="use-template"]').click();
      cy.wait('@getTemplates');

      cy.get('[data-testid="template-1"]').click();
      cy.get('[data-testid="universe-name-input"]').type('Template Universe');
      cy.get('[data-testid="submit-universe"]').click();
      cy.wait('@createUniverse');

      cy.get('[data-testid="universe-list"]').should(
        'contain',
        'Template Universe'
      );
    });
  });

  describe('Universe Editing', () => {
    beforeEach(() => {
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Updated Universe',
          description: 'Updated Description',
          owner: 1,
          sharedWith: [],
          updatedAt: Date.now(),
        },
      }).as('updateUniverse');
    });

    it('should edit universe details', () => {
      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="edit-universe"]').click();

      cy.get('[data-testid="universe-name-input"]')
        .clear()
        .type('Updated Universe');
      cy.get('[data-testid="universe-description-input"]')
        .clear()
        .type('Updated Description');

      cy.get('[data-testid="save-universe"]').click();
      cy.wait('@updateUniverse');

      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Updated Universe'
      );
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="edit-universe"]').click();

      cy.get('[data-testid="universe-name-input"]').clear();
      cy.get('[data-testid="save-universe"]').click();

      cy.get('[data-testid="name-error"]')
        .should('be.visible')
        .and('contain', 'Name is required');
    });
  });

  describe('Universe Sharing', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/users/search?q=*', {
        statusCode: 200,
        body: {
          users: [{ id: 2, username: 'user2', email: 'user2@example.com' }],
        },
      }).as('searchUsers');

      cy.intercept('POST', '/api/universes/1/share', {
        statusCode: 200,
        body: {
          success: true,
          sharedWith: [2],
        },
      }).as('shareUniverse');
    });

    it('should share universe with user', () => {
      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="share-universe"]').click();

      cy.get('[data-testid="user-search"]').type('user2');
      cy.wait('@searchUsers');

      cy.get('[data-testid="user-2"]').click();
      cy.get('[data-testid="share-submit"]').click();
      cy.wait('@shareUniverse');

      cy.get('[data-testid="shared-users"]').should('contain', 'user2');
    });

    it('should manage sharing permissions', () => {
      cy.intercept('PUT', '/api/universes/1/permissions', {
        statusCode: 200,
        body: {
          success: true,
          permissions: {
            2: { canEdit: true, canShare: false },
          },
        },
      }).as('updatePermissions');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="share-universe"]').click();
      cy.get('[data-testid="shared-user-2"]').click();

      cy.get('[data-testid="permission-edit"]').check();
      cy.get('[data-testid="permission-share"]').uncheck();
      cy.get('[data-testid="update-permissions"]').click();
      cy.wait('@updatePermissions');

      cy.get('[data-testid="shared-user-2"]').within(() => {
        cy.get('[data-testid="can-edit"]').should('be.checked');
        cy.get('[data-testid="can-share"]').should('not.be.checked');
      });
    });
  });

  describe('Universe Export/Import', () => {
    it('should export universe', () => {
      cy.intercept('GET', '/api/universes/1/export', {
        statusCode: 200,
        body: {
          data: 'exported-universe-data',
          format: 'json',
        },
      }).as('exportUniverse');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="export-universe"]').click();
      cy.get('[data-testid="export-format"]').select('json');
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@exportUniverse');

      cy.get('[data-testid="download-export"]')
        .should('have.attr', 'href')
        .and('include', 'exported-universe-data');
    });

    it('should import universe', () => {
      cy.intercept('POST', '/api/universes/import', {
        statusCode: 200,
        body: {
          id: 3,
          name: 'Imported Universe',
          description: 'Imported Description',
        },
      }).as('importUniverse');

      const testFile = new File(['test universe data'], 'universe.json', {
        type: 'application/json',
      });

      cy.get('[data-testid="import-universe"]').click();
      cy.get('[data-testid="universe-file"]').attachFile(testFile);
      cy.get('[data-testid="start-import"]').click();
      cy.wait('@importUniverse');

      cy.get('[data-testid="universe-list"]').should(
        'contain',
        'Imported Universe'
      );
    });
  });

  describe('Universe Analytics', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/universes/1/analytics', {
        statusCode: 200,
        body: {
          views: 100,
          edits: 50,
          collaborators: 5,
          lastActive: Date.now() - 1000,
        },
      }).as('getAnalytics');
    });

    it('should display analytics', () => {
      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="view-analytics"]').click();
      cy.wait('@getAnalytics');

      cy.get('[data-testid="analytics-panel"]').within(() => {
        cy.get('[data-testid="view-count"]').should('contain', '100');
        cy.get('[data-testid="edit-count"]').should('contain', '50');
        cy.get('[data-testid="collaborator-count"]').should('contain', '5');
      });
    });

    it('should filter analytics by date', () => {
      cy.intercept('GET', '/api/universes/1/analytics?start=*&end=*', {
        statusCode: 200,
        body: {
          views: 50,
          edits: 25,
          collaborators: 3,
        },
      }).as('getFilteredAnalytics');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="view-analytics"]').click();

      cy.get('[data-testid="date-range"]').click();
      cy.get('[data-testid="last-week"]').click();
      cy.wait('@getFilteredAnalytics');

      cy.get('[data-testid="analytics-panel"]').within(() => {
        cy.get('[data-testid="view-count"]').should('contain', '50');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 500,
        body: {
          error: 'Failed to create universe',
        },
      }).as('createError');

      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="universe-name-input"]').type('Error Universe');
      cy.get('[data-testid="submit-universe"]').click();
      cy.wait('@createError');

      cy.get('[data-testid="create-error"]')
        .should('be.visible')
        .and('contain', 'Failed to create universe');
    });

    it('should handle update errors', () => {
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 500,
        body: {
          error: 'Failed to update universe',
        },
      }).as('updateError');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="edit-universe"]').click();
      cy.get('[data-testid="universe-name-input"]')
        .clear()
        .type('Error Update');
      cy.get('[data-testid="save-universe"]').click();
      cy.wait('@updateError');

      cy.get('[data-testid="update-error"]')
        .should('be.visible')
        .and('contain', 'Failed to update universe');
    });

    it('should handle share errors', () => {
      cy.intercept('POST', '/api/universes/1/share', {
        statusCode: 500,
        body: {
          error: 'Failed to share universe',
        },
      }).as('shareError');

      cy.get('[data-testid="universe-1"]').click();
      cy.get('[data-testid="share-universe"]').click();
      cy.get('[data-testid="user-search"]').type('user2');
      cy.get('[data-testid="user-2"]').click();
      cy.get('[data-testid="share-submit"]').click();
      cy.wait('@shareError');

      cy.get('[data-testid="share-error"]')
        .should('be.visible')
        .and('contain', 'Failed to share universe');
    });
  });
});
