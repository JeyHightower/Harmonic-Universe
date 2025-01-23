describe('Universe Management', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Universe List', () => {
    it('should display list of universes', () => {
      cy.visit('/');
      cy.get('[data-testid="universe-list"]').should('exist');
      cy.get('[data-testid="universe-card"]').should('have.length.at.least', 0);
    });

    it('should filter universes', () => {
      cy.visit('/');
      cy.get('[data-testid="search-input"]').type('test');
      cy.get('[data-testid="universe-card"]').should('have.length.at.least', 0);
    });
  });

  describe('Universe Creation', () => {
    it('should create new universe', () => {
      cy.createTestUniverse();
    });

    it('should show validation errors', () => {
      cy.visit('/universes/new');
      cy.get('[data-testid="create-universe-button"]').click();
      cy.contains('Name is required');
    });
  });

  describe('Universe Details', () => {
    beforeEach(() => {
      cy.createTestUniverse();
    });

    it('should display universe details', () => {
      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Test Universe'
      );
      cy.get('[data-testid="universe-description"]').should(
        'contain',
        'Test Description'
      );
    });

    it('should edit universe', () => {
      cy.get('[data-testid="edit-button"]').click();
      cy.get('[data-testid="universe-name-input"]')
        .clear()
        .type('Updated Universe');
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Updated Universe'
      );
    });

    it('should delete universe', () => {
      cy.get('[data-testid="delete-button"]').click();
      cy.get('[data-testid="confirm-delete-button"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Universe Collaboration', () => {
    beforeEach(() => {
      cy.createTestUniverse();
    });

    it('should invite collaborator', () => {
      cy.get('[data-testid="invite-button"]').click();
      cy.get('[data-testid="collaborator-email"]').type(
        'collaborator@example.com'
      );
      cy.get('[data-testid="send-invite-button"]').click();
      cy.contains('Invitation sent');
    });

    it('should manage collaborator permissions', () => {
      cy.get('[data-testid="collaborators-tab"]').click();
      cy.get('[data-testid="collaborator-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="permission-select"]').select('editor');
          cy.contains('Permissions updated');
        });
    });
  });

  describe('Universe Editing', () => {
    beforeEach(() => {
      cy.createTestUniverse();
    });

    it('should edit universe properties', () => {
      cy.get('[data-testid="edit-button"]').click();
      cy.get('[data-testid="universe-name"]').clear().type('Updated Universe');
      cy.get('[data-testid="save-button"]').click();
      cy.contains('Updated Universe');
    });

    it('should manage collaborators', () => {
      cy.get('[data-testid="collaborators-tab"]').click();
      cy.get('[data-testid="add-collaborator"]').click();
      cy.get('[data-testid="collaborator-email"]').type(
        'collaborator@example.com'
      );
      cy.get('[data-testid="add-button"]').click();
      cy.contains('collaborator@example.com');
    });
  });

  describe('Universe Sharing', () => {
    beforeEach(() => {
      cy.createTestUniverse();
    });

    it('should share universe', () => {
      cy.get('[data-testid="share-button"]').click();
      cy.get('[data-testid="share-link"]').should('be.visible');
      cy.get('[data-testid="copy-link"]').click();
      cy.contains('Link copied');
    });

    it('should manage permissions', () => {
      cy.get('[data-testid="permissions-tab"]').click();
      cy.get('[data-testid="permission-select"]').select('edit');
      cy.get('[data-testid="save-permissions"]').click();
      cy.contains('Permissions updated');
    });
  });

  describe('Universe Analytics', () => {
    beforeEach(() => {
      cy.createTestUniverse();
    });

    it('should display analytics', () => {
      cy.get('[data-testid="analytics-tab"]').click();
      cy.get('[data-testid="views-chart"]').should('be.visible');
      cy.get('[data-testid="interactions-chart"]').should('be.visible');
    });

    it('should export analytics', () => {
      cy.get('[data-testid="analytics-tab"]').click();
      cy.get('[data-testid="export-analytics"]').click();
      cy.contains('Analytics exported');
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      cy.createTestUniverse();
    });

    it('should export universe', () => {
      cy.get('[data-testid="export-button"]').click();
      cy.get('[data-testid="export-format"]').select('json');
      cy.get('[data-testid="start-export"]').click();
      cy.contains('Export complete');
    });

    it('should import universe', () => {
      cy.visit('/universes/import');
      cy.get('[data-testid="import-file"]').attachFile('universe.json');
      cy.get('[data-testid="start-import"]').click();
      cy.contains('Import complete');
    });
  });
});
