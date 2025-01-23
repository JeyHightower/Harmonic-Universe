describe('Rich Text Editor', () => {
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

  describe('Editor Initialization', () => {
    it('should render the editor with default toolbar', () => {
      cy.get('[data-testid="rich-text-editor"]').should('exist');
      cy.get('[data-testid="editor-toolbar"]').should('exist');
      cy.get('[data-testid="editor-content"]').should('exist');
    });

    it('should start with empty content when no initial value is provided', () => {
      cy.get('[data-testid="editor-content"]').should('be.empty');
    });

    it('should render initial content when provided', () => {
      const initialContent = 'Initial test content';
      cy.get('[data-testid="editor-content"]').type(initialContent);
      cy.get('[data-testid="editor-content"]').should(
        'contain',
        initialContent
      );
    });
  });

  describe('Text Formatting', () => {
    it('should apply bold formatting', () => {
      cy.get('[data-testid="editor-content"]').type('Test text');
      cy.get('[data-testid="bold-button"]').click();
      cy.get('[data-testid="editor-content"]').find('strong').should('exist');
    });

    it('should apply italic formatting', () => {
      cy.get('[data-testid="editor-content"]').type('Test text');
      cy.get('[data-testid="italic-button"]').click();
      cy.get('[data-testid="editor-content"]').find('em').should('exist');
    });

    it('should create bullet list', () => {
      cy.get('[data-testid="editor-content"]').type('List item');
      cy.get('[data-testid="bullet-list-button"]').click();
      cy.get('[data-testid="editor-content"]').find('ul > li').should('exist');
    });

    it('should create numbered list', () => {
      cy.get('[data-testid="editor-content"]').type('List item');
      cy.get('[data-testid="numbered-list-button"]').click();
      cy.get('[data-testid="editor-content"]').find('ol > li').should('exist');
    });
  });

  describe('Content Updates', () => {
    it('should update content when typing', () => {
      const testText = 'Testing content updates';
      cy.get('[data-testid="editor-content"]').type(testText);
      cy.get('[data-testid="editor-content"]').should('contain', testText);
    });

    it('should handle paste events', () => {
      const pasteText = 'Pasted content';
      cy.get('[data-testid="editor-content"]')
        .invoke('val', pasteText)
        .trigger('paste');
      cy.get('[data-testid="editor-content"]').should('contain', pasteText);
    });

    it('should handle undo/redo', () => {
      const testText = 'Testing undo redo';
      cy.get('[data-testid="editor-content"]').type(testText);
      cy.get('[data-testid="undo-button"]').click();
      cy.get('[data-testid="editor-content"]').should('not.contain', testText);
      cy.get('[data-testid="redo-button"]').click();
      cy.get('[data-testid="editor-content"]').should('contain', testText);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      cy.intercept('GET', '/api/editor-config', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('getEditorConfig');
      cy.visit('/');
      cy.get('[data-testid="editor-error"]').should('exist');
      cy.get('[data-testid="retry-button"]').should('exist');
    });

    it('should handle content save errors', () => {
      cy.intercept('POST', '/api/save-content', {
        statusCode: 500,
        body: { error: 'Save failed' },
      }).as('saveContent');
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="save-error"]').should('exist');
    });
  });

  describe('Performance', () => {
    it('should handle large content without performance issues', () => {
      const largeContent = 'A'.repeat(10000);
      cy.get('[data-testid="editor-content"]')
        .invoke('val', largeContent)
        .trigger('input');
      cy.get('[data-testid="editor-content"]').should('contain', largeContent);
    });

    it('should debounce content updates', () => {
      cy.clock();
      const testText = 'Testing debounce';
      cy.get('[data-testid="editor-content"]').type(testText);
      cy.tick(500);
      cy.get('@contentUpdateSpy').should('have.been.calledOnce');
    });
  });
});
