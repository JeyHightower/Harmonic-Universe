describe('Universe Management', () => {
  beforeEach(() => {
    // Login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock universe list
    cy.intercept('GET', '/api/universes', {
      statusCode: 200,
      body: {
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            owner_id: 1,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ],
      },
    }).as('getUniverses');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universes');
    cy.wait('@getUniverses');
  });

  it('should list universes', () => {
    cy.get('[data-testid="universe-list"]').should('be.visible');
    cy.get('[data-testid="universe-card"]').should('have.length', 1);
    cy.contains('Test Universe').should('be.visible');
  });

  it('should create universe', () => {
    cy.intercept('POST', '/api/universes', {
      statusCode: 201,
      body: {
        id: 2,
        name: 'New Universe',
        description: 'A new test universe',
        owner_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }).as('createUniverse');

    cy.get('[data-testid="create-universe"]').click();
    cy.get('input[name="name"]').type('New Universe');
    cy.get('textarea[name="description"]').type('A new test universe');
    cy.get('button[type="submit"]').click();

    cy.wait('@createUniverse');
    cy.contains('Universe created successfully').should('be.visible');
    cy.url().should('include', '/universe/2');
  });

  it('should edit universe', () => {
    cy.intercept('PUT', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Updated Universe',
        description: 'An updated test universe',
        owner_id: 1,
        updated_at: new Date().toISOString(),
      },
    }).as('updateUniverse');

    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="edit-universe"]').click();
    cy.get('input[name="name"]').clear().type('Updated Universe');
    cy.get('textarea[name="description"]')
      .clear()
      .type('An updated test universe');
    cy.get('button[type="submit"]').click();

    cy.wait('@updateUniverse');
    cy.contains('Universe updated successfully').should('be.visible');
  });

  it('should delete universe', () => {
    cy.intercept('DELETE', '/api/universes/1', {
      statusCode: 200,
    }).as('deleteUniverse');

    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="delete-universe"]').click();
    cy.get('[data-testid="confirm-delete"]').click();

    cy.wait('@deleteUniverse');
    cy.contains('Universe deleted successfully').should('be.visible');
    cy.url().should('include', '/universes');
  });

  it('should handle universe templates', () => {
    cy.intercept('GET', '/api/universe-templates', {
      statusCode: 200,
      body: {
        templates: [
          {
            id: 1,
            name: 'Basic Template',
            description: 'A basic universe template',
            preview_url: 'https://example.com/preview.jpg',
          },
        ],
      },
    }).as('getTemplates');

    cy.get('[data-testid="create-from-template"]').click();
    cy.wait('@getTemplates');

    cy.get('[data-testid="template-card"]').should('have.length', 1);
    cy.get('[data-testid="use-template"]').click();

    cy.get('input[name="name"]').type('Template Universe');
    cy.get('button[type="submit"]').click();

    cy.contains('Universe created from template').should('be.visible');
  });

  it('should handle universe sharing', () => {
    cy.intercept('POST', '/api/universes/1/share', {
      statusCode: 200,
      body: {
        shared_with: [
          {
            user_id: 2,
            username: 'collaborator',
            permission: 'edit',
          },
        ],
      },
    }).as('shareUniverse');

    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="share-universe"]').click();
    cy.get('input[name="collaborator"]').type('collaborator');
    cy.get('[data-testid="permission-select"]').select('edit');
    cy.get('[data-testid="add-collaborator"]').click();

    cy.wait('@shareUniverse');
    cy.contains('Universe shared successfully').should('be.visible');
  });

  it('should handle universe versioning', () => {
    cy.intercept('GET', '/api/universes/1/versions', {
      statusCode: 200,
      body: {
        versions: [
          {
            id: 1,
            version: '1.0.0',
            created_at: '2024-01-15T00:00:00Z',
            changes: 'Initial version',
          },
        ],
      },
    }).as('getVersions');

    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="version-history"]').click();
    cy.wait('@getVersions');

    cy.get('[data-testid="version-list"]').should('be.visible');
    cy.get('[data-testid="version-item"]').should('have.length', 1);

    // Create new version
    cy.get('[data-testid="create-version"]').click();
    cy.get('input[name="version"]').type('1.1.0');
    cy.get('textarea[name="changes"]').type('Updated physics parameters');
    cy.get('[data-testid="save-version"]').click();

    cy.contains('Version 1.1.0 created').should('be.visible');
  });

  it('should handle universe export/import', () => {
    // Test export
    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="export-universe"]').click();
    cy.get('[data-testid="export-format"]').select('json');
    cy.get('[data-testid="start-export"]').click();

    cy.get('[data-testid="download-export"]')
      .should('have.attr', 'href')
      .and('include', '/exports/');

    // Test import
    const testFile = new File(['{}'], 'universe.json', {
      type: 'application/json',
    });
    cy.get('[data-testid="import-universe"]').click();
    cy.get('input[type="file"]').attachFile(testFile);
    cy.get('[data-testid="start-import"]').click();

    cy.contains('Universe imported successfully').should('be.visible');
  });

  it('should handle universe analytics', () => {
    cy.intercept('GET', '/api/universes/1/analytics', {
      statusCode: 200,
      body: {
        views: 100,
        collaborators: 5,
        edits: 25,
        last_active: '2024-01-15T00:00:00Z',
        popular_elements: [{ name: 'Particle System', usage: 80 }],
      },
    }).as('getAnalytics');

    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="view-analytics"]').click();
    cy.wait('@getAnalytics');

    cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
    cy.get('[data-testid="views-count"]').should('contain', '100');
    cy.get('[data-testid="collaborators-count"]').should('contain', '5');
    cy.get('[data-testid="edits-count"]').should('contain', '25');
  });

  it('should handle error states', () => {
    // Test network error
    cy.intercept('GET', '/api/universes', {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    }).as('getUniversesError');

    cy.reload();
    cy.contains('Error loading universes').should('be.visible');
    cy.get('[data-testid="retry-button"]').click();

    // Test validation error
    cy.get('[data-testid="create-universe"]').click();
    cy.get('button[type="submit"]').click();
    cy.contains('Name is required').should('be.visible');

    // Test permission error
    cy.intercept('PUT', '/api/universes/1', {
      statusCode: 403,
      body: {
        error: 'Permission denied',
      },
    }).as('updateUniverseError');

    cy.get('[data-testid="universe-card"]').first().click();
    cy.get('[data-testid="edit-universe"]').click();
    cy.contains('You do not have permission to edit this universe').should(
      'be.visible'
    );
  });
});
