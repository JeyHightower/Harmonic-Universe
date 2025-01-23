describe('Templates', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login();
    cy.intercept('GET', '/api/templates', {
      statusCode: 200,
      body: {
        templates: [
          {
            id: 1,
            name: 'Basic Template',
            description: 'A basic universe template',
            category: 'general',
            previewImage: 'https://example.com/preview1.jpg',
            settings: {
              maxParticipants: 10,
              isPublic: true,
            },
          },
        ],
      },
    }).as('getTemplates');
  });

  describe('Template List', () => {
    it('should display available templates', () => {
      cy.get('[data-testid="template-list"]').should('be.visible');
      cy.get('[data-testid="template-card"]').should('have.length', 1);
      cy.get('[data-testid="template-name"]').should(
        'contain',
        'Basic Template'
      );
    });

    it('should show loading state while fetching templates', () => {
      cy.intercept('GET', '/api/templates', {
        delay: 1000,
        statusCode: 200,
        body: { templates: [] },
      }).as('getTemplatesDelayed');
      cy.get('[data-testid="templates-loading"]').should('be.visible');
      cy.wait('@getTemplatesDelayed');
      cy.get('[data-testid="templates-loading"]').should('not.exist');
    });

    it('should handle empty template list', () => {
      cy.intercept('GET', '/api/templates', {
        statusCode: 200,
        body: { templates: [] },
      }).as('getEmptyTemplates');
      cy.get('[data-testid="empty-templates"]').should('be.visible');
      cy.get('[data-testid="create-template-button"]').should('exist');
    });

    it('should filter templates by category', () => {
      cy.intercept('GET', '/api/templates?category=music', {
        statusCode: 200,
        body: {
          templates: [
            {
              id: 2,
              name: 'Music Template',
              category: 'music',
            },
          ],
        },
      }).as('getFilteredTemplates');
      cy.get('[data-testid="category-filter"]').select('music');
      cy.wait('@getFilteredTemplates');
      cy.get('[data-testid="template-name"]').should(
        'contain',
        'Music Template'
      );
    });
  });

  describe('Template Creation', () => {
    it('should create new template', () => {
      cy.intercept('POST', '/api/templates', {
        statusCode: 201,
        body: {
          id: 3,
          name: 'New Template',
          description: 'Test description',
          category: 'general',
        },
      }).as('createTemplate');

      cy.get('[data-testid="create-template-button"]').click();
      cy.get('[data-testid="template-name-input"]').type('New Template');
      cy.get('[data-testid="template-description"]').type('Test description');
      cy.get('[data-testid="template-category"]').select('general');
      cy.get('[data-testid="save-template"]').click();

      cy.wait('@createTemplate');
      cy.get('[data-testid="template-success"]').should('be.visible');
    });

    it('should validate template creation', () => {
      cy.get('[data-testid="create-template-button"]').click();
      cy.get('[data-testid="save-template"]').click();
      cy.get('[data-testid="name-error"]').should('be.visible');
    });

    it('should handle template creation errors', () => {
      cy.intercept('POST', '/api/templates', {
        statusCode: 500,
        body: { error: 'Failed to create template' },
      }).as('createTemplateError');

      cy.get('[data-testid="create-template-button"]').click();
      cy.get('[data-testid="template-name-input"]').type('New Template');
      cy.get('[data-testid="save-template"]').click();
      cy.get('[data-testid="template-error"]').should('be.visible');
    });
  });

  describe('Template Details', () => {
    it('should display template details', () => {
      cy.intercept('GET', '/api/templates/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Basic Template',
          description: 'A basic universe template',
          category: 'general',
          settings: {
            maxParticipants: 10,
            isPublic: true,
          },
        },
      }).as('getTemplateDetails');

      cy.get('[data-testid="template-card"]').first().click();
      cy.wait('@getTemplateDetails');
      cy.get('[data-testid="template-details"]').should('be.visible');
      cy.get('[data-testid="template-settings"]').should('be.visible');
    });

    it('should handle missing template details', () => {
      cy.intercept('GET', '/api/templates/999', {
        statusCode: 404,
        body: { error: 'Template not found' },
      }).as('getMissingTemplate');

      cy.visit('/templates/999');
      cy.get('[data-testid="template-not-found"]').should('be.visible');
    });
  });

  describe('Template Editing', () => {
    it('should edit existing template', () => {
      cy.intercept('PUT', '/api/templates/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Updated Template',
          description: 'Updated description',
        },
      }).as('updateTemplate');

      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="edit-template-button"]').click();
      cy.get('[data-testid="template-name-input"]')
        .clear()
        .type('Updated Template');
      cy.get('[data-testid="template-description"]')
        .clear()
        .type('Updated description');
      cy.get('[data-testid="save-template"]').click();

      cy.wait('@updateTemplate');
      cy.get('[data-testid="template-success"]').should('be.visible');
    });

    it('should validate template updates', () => {
      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="edit-template-button"]').click();
      cy.get('[data-testid="template-name-input"]').clear();
      cy.get('[data-testid="save-template"]').click();
      cy.get('[data-testid="name-error"]').should('be.visible');
    });

    it('should handle template update errors', () => {
      cy.intercept('PUT', '/api/templates/1', {
        statusCode: 500,
        body: { error: 'Failed to update template' },
      }).as('updateTemplateError');

      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="edit-template-button"]').click();
      cy.get('[data-testid="template-name-input"]')
        .clear()
        .type('Updated Template');
      cy.get('[data-testid="save-template"]').click();
      cy.get('[data-testid="template-error"]').should('be.visible');
    });
  });

  describe('Template Deletion', () => {
    it('should delete template', () => {
      cy.intercept('DELETE', '/api/templates/1', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteTemplate');

      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="delete-template-button"]').click();
      cy.get('[data-testid="confirm-delete"]').click();

      cy.wait('@deleteTemplate');
      cy.get('[data-testid="template-deleted"]').should('be.visible');
      cy.get('[data-testid="template-card"]').should('not.exist');
    });

    it('should handle template deletion errors', () => {
      cy.intercept('DELETE', '/api/templates/1', {
        statusCode: 500,
        body: { error: 'Failed to delete template' },
      }).as('deleteTemplateError');

      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="delete-template-button"]').click();
      cy.get('[data-testid="confirm-delete"]').click();
      cy.get('[data-testid="delete-error"]').should('be.visible');
    });
  });

  describe('Template Application', () => {
    it('should apply template to new universe', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 201,
        body: {
          id: 1,
          name: 'New Universe',
          description: 'Created from template',
          settings: {
            maxParticipants: 10,
            isPublic: true,
          },
        },
      }).as('createUniverse');

      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="use-template-button"]').click();
      cy.get('[data-testid="universe-name"]').type('New Universe');
      cy.get('[data-testid="universe-description"]').type(
        'Created from template'
      );
      cy.get('[data-testid="create-universe"]').click();

      cy.wait('@createUniverse');
      cy.get('[data-testid="universe-created"]').should('be.visible');
    });

    it('should validate universe creation from template', () => {
      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="use-template-button"]').click();
      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="name-error"]').should('be.visible');
    });

    it('should handle template application errors', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 500,
        body: { error: 'Failed to create universe' },
      }).as('createUniverseError');

      cy.get('[data-testid="template-card"]').first().click();
      cy.get('[data-testid="use-template-button"]').click();
      cy.get('[data-testid="universe-name"]').type('New Universe');
      cy.get('[data-testid="create-universe"]').click();
      cy.get('[data-testid="creation-error"]').should('be.visible');
    });
  });
});
