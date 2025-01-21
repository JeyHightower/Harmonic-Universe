describe('Templates System Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock templates list
    cy.intercept('GET', '/api/templates', {
      statusCode: 200,
      body: {
        templates: [
          {
            id: 1,
            name: 'Basic Universe',
            description: 'A simple starting point',
            category: 'basic',
            author: { id: 1, username: 'testuser' },
            usageCount: 100,
            rating: 4.5,
            isPublic: true,
          },
        ],
        categories: ['basic', 'advanced', 'specialized'],
      },
    }).as('getTemplates');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/templates');
    cy.wait('@getTemplates');
  });

  describe('Template Management', () => {
    it('should create new template', () => {
      cy.intercept('POST', '/api/templates', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'Custom Template',
          description: 'My custom universe template',
          category: 'specialized',
          isPublic: false,
        },
      }).as('createTemplate');

      cy.get('[data-testid="create-template"]').click();
      cy.get('[data-testid="template-name"]').type('Custom Template');
      cy.get('[data-testid="template-description"]').type(
        'My custom universe template'
      );
      cy.get('[data-testid="template-category"]').select('specialized');
      cy.get('[data-testid="template-visibility"]').select('private');
      cy.get('[data-testid="save-template"]').click();
      cy.wait('@createTemplate');

      cy.get('[data-testid="template-2"]').should('contain', 'Custom Template');
    });

    it('should edit template', () => {
      cy.intercept('PUT', '/api/templates/1', {
        statusCode: 200,
        body: {
          name: 'Updated Template',
          description: 'Updated description',
          category: 'advanced',
        },
      }).as('updateTemplate');

      cy.get('[data-testid="edit-template-1"]').click();
      cy.get('[data-testid="template-name"]').clear().type('Updated Template');
      cy.get('[data-testid="template-description"]')
        .clear()
        .type('Updated description');
      cy.get('[data-testid="template-category"]').select('advanced');
      cy.get('[data-testid="save-template"]').click();
      cy.wait('@updateTemplate');

      cy.get('[data-testid="template-1"]').should(
        'contain',
        'Updated Template'
      );
    });
  });

  describe('Template Usage', () => {
    it('should create universe from template', () => {
      cy.intercept('POST', '/api/universes/from-template/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'New Universe',
          template: { id: 1, name: 'Basic Universe' },
        },
      }).as('createFromTemplate');

      cy.get('[data-testid="use-template-1"]').click();
      cy.get('[data-testid="new-universe-name"]').type('New Universe');
      cy.get('[data-testid="create-from-template"]').click();
      cy.wait('@createFromTemplate');

      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Universe created successfully'
      );
    });

    it('should show template preview', () => {
      cy.intercept('GET', '/api/templates/1/preview', {
        statusCode: 200,
        body: {
          preview: {
            screenshot: 'preview.jpg',
            features: ['Feature 1', 'Feature 2'],
            requirements: ['Requirement 1'],
          },
        },
      }).as('getPreview');

      cy.get('[data-testid="preview-template-1"]').click();
      cy.wait('@getPreview');

      cy.get('[data-testid="template-preview"]').should('be.visible');
      cy.get('[data-testid="preview-features"]').should('contain', 'Feature 1');
    });
  });

  describe('Template Categories', () => {
    it('should filter templates by category', () => {
      cy.intercept('GET', '/api/templates?category=advanced', {
        statusCode: 200,
        body: {
          templates: [
            {
              id: 3,
              name: 'Advanced Template',
              category: 'advanced',
            },
          ],
        },
      }).as('filterTemplates');

      cy.get('[data-testid="category-filter"]').select('advanced');
      cy.wait('@filterTemplates');

      cy.get('[data-testid="template-list"]').should(
        'contain',
        'Advanced Template'
      );
    });

    it('should manage categories', () => {
      cy.intercept('POST', '/api/templates/categories', {
        statusCode: 200,
        body: {
          category: 'custom',
          status: 'created',
        },
      }).as('createCategory');

      cy.get('[data-testid="manage-categories"]').click();
      cy.get('[data-testid="new-category"]').type('custom');
      cy.get('[data-testid="add-category"]').click();
      cy.wait('@createCategory');

      cy.get('[data-testid="category-list"]').should('contain', 'custom');
    });
  });

  describe('Template Sharing', () => {
    it('should share template', () => {
      cy.intercept('POST', '/api/templates/1/share', {
        statusCode: 200,
        body: {
          shareUrl: 'https://example.com/template/abc123',
          accessLevel: 'view',
        },
      }).as('shareTemplate');

      cy.get('[data-testid="share-template-1"]').click();
      cy.get('[data-testid="share-access-level"]').select('view');
      cy.get('[data-testid="generate-share-link"]').click();
      cy.wait('@shareTemplate');

      cy.get('[data-testid="share-url"]')
        .should('have.value')
        .and('include', 'template/abc123');
    });

    it('should handle template permissions', () => {
      cy.intercept('PUT', '/api/templates/1/permissions', {
        statusCode: 200,
        body: {
          permissions: {
            public: true,
            allowCopy: true,
            allowModify: false,
          },
        },
      }).as('updatePermissions');

      cy.get('[data-testid="template-permissions-1"]').click();
      cy.get('[data-testid="permission-public"]').check();
      cy.get('[data-testid="permission-copy"]').check();
      cy.get('[data-testid="permission-modify"]').uncheck();
      cy.get('[data-testid="save-permissions"]').click();
      cy.wait('@updatePermissions');

      cy.get('[data-testid="template-1"]').should('have.class', 'public');
    });
  });

  describe('Template Versioning', () => {
    it('should handle version history', () => {
      cy.intercept('GET', '/api/templates/1/versions', {
        statusCode: 200,
        body: {
          versions: [
            {
              id: 2,
              changes: 'Updated features',
              timestamp: new Date().toISOString(),
            },
            {
              id: 1,
              changes: 'Initial version',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      }).as('getVersions');

      cy.get('[data-testid="template-versions-1"]').click();
      cy.wait('@getVersions');

      cy.get('[data-testid="version-list"]').should(
        'contain',
        'Updated features'
      );
    });

    it('should restore previous version', () => {
      cy.intercept('POST', '/api/templates/1/restore', {
        statusCode: 200,
        body: {
          version: 1,
          status: 'restored',
        },
      }).as('restoreVersion');

      cy.get('[data-testid="template-versions-1"]').click();
      cy.get('[data-testid="restore-version-1"]').click();
      cy.wait('@restoreVersion');

      cy.get('[data-testid="version-restored"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors', () => {
      cy.intercept('POST', '/api/templates', {
        statusCode: 500,
        body: {
          error: 'Failed to create template',
        },
      }).as('createError');

      cy.get('[data-testid="create-template"]').click();
      cy.get('[data-testid="template-name"]').type('Error Template');
      cy.get('[data-testid="save-template"]').click();
      cy.wait('@createError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to create template');
    });

    it('should handle usage errors', () => {
      cy.intercept('POST', '/api/universes/from-template/1', {
        statusCode: 500,
        body: {
          error: 'Template usage failed',
        },
      }).as('usageError');

      cy.get('[data-testid="use-template-1"]').click();
      cy.get('[data-testid="new-universe-name"]').type('New Universe');
      cy.get('[data-testid="create-from-template"]').click();
      cy.wait('@usageError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Template usage failed');
    });
  });
});
