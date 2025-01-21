describe('Rich Text Editor Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock initial document
    cy.intercept('GET', '/api/documents/1', {
      statusCode: 200,
      body: {
        id: 1,
        title: 'Test Document',
        content: '<p>Initial content</p>',
        lastModified: new Date().toISOString(),
        version: 1,
      },
    }).as('getDocument');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/documents/1/edit');
    cy.wait('@getDocument');
  });

  describe('Basic Formatting', () => {
    it('should handle text formatting', () => {
      // Mock content update
      cy.intercept('PUT', '/api/documents/1', {
        statusCode: 200,
        body: {
          version: 2,
          lastModified: new Date().toISOString(),
        },
      }).as('updateDocument');

      // Test bold
      cy.get('[data-testid="editor-content"]').type('{selectall}');
      cy.get('[data-testid="format-bold"]').click();
      cy.get('[data-testid="editor-content"]')
        .find('strong')
        .should('contain', 'Initial content');

      // Test italic
      cy.get('[data-testid="format-italic"]').click();
      cy.get('[data-testid="editor-content"]').find('em').should('exist');

      // Test underline
      cy.get('[data-testid="format-underline"]').click();
      cy.get('[data-testid="editor-content"]').find('u').should('exist');

      cy.wait('@updateDocument');
    });

    it('should handle headings and paragraphs', () => {
      // Clear and type new content
      cy.get('[data-testid="editor-content"]').clear();

      // Test heading levels
      cy.get('[data-testid="format-heading"]').click();
      cy.get('[data-testid="heading-level-1"]').click();
      cy.get('[data-testid="editor-content"]').type('Heading 1{enter}');

      cy.get('[data-testid="format-heading"]').click();
      cy.get('[data-testid="heading-level-2"]').click();
      cy.get('[data-testid="editor-content"]').type('Heading 2{enter}');

      // Verify structure
      cy.get('[data-testid="editor-content"]').within(() => {
        cy.get('h1').should('contain', 'Heading 1');
        cy.get('h2').should('contain', 'Heading 2');
      });
    });
  });

  describe('Lists and Indentation', () => {
    it('should handle bullet lists', () => {
      cy.get('[data-testid="editor-content"]').clear();
      cy.get('[data-testid="format-bullet-list"]').click();

      // Create list items
      cy.get('[data-testid="editor-content"]')
        .type('Item 1{enter}')
        .type('Item 2{enter}')
        .type('Item 3');

      // Verify list structure
      cy.get('[data-testid="editor-content"]').within(() => {
        cy.get('ul').should('exist');
        cy.get('li').should('have.length', 3);
      });
    });

    it('should handle numbered lists', () => {
      cy.get('[data-testid="editor-content"]').clear();
      cy.get('[data-testid="format-numbered-list"]').click();

      // Create list items
      cy.get('[data-testid="editor-content"]')
        .type('Step 1{enter}')
        .type('Step 2{enter}')
        .type('Step 3');

      // Verify list structure
      cy.get('[data-testid="editor-content"]').within(() => {
        cy.get('ol').should('exist');
        cy.get('li').should('have.length', 3);
      });
    });

    it('should handle indentation', () => {
      cy.get('[data-testid="editor-content"]').clear();
      cy.get('[data-testid="format-bullet-list"]').click();

      // Create nested list
      cy.get('[data-testid="editor-content"]')
        .type('Parent{enter}')
        .type('{tab}Child 1{enter}')
        .type('{tab}{tab}Grandchild{enter}')
        .type('{shift}{tab}Child 2');

      // Verify nesting
      cy.get('[data-testid="editor-content"]').within(() => {
        cy.get('ul > li > ul > li > ul > li').should('exist');
      });
    });
  });

  describe('Links and Media', () => {
    it('should handle links', () => {
      // Select text and create link
      cy.get('[data-testid="editor-content"]').type(
        'Visit our {selectall}website'
      );
      cy.get('[data-testid="insert-link"]').click();
      cy.get('[data-testid="link-url"]').type('https://example.com');
      cy.get('[data-testid="save-link"]').click();

      // Verify link
      cy.get('[data-testid="editor-content"]')
        .find('a')
        .should('have.attr', 'href', 'https://example.com')
        .and('contain', 'website');
    });

    it('should handle images', () => {
      // Mock image upload
      cy.intercept('POST', '/api/documents/1/images', {
        statusCode: 200,
        body: {
          url: 'https://example.com/image.jpg',
          alt: 'Test image',
        },
      }).as('uploadImage');

      // Upload image
      cy.get('[data-testid="insert-image"]').click();
      cy.get('[data-testid="image-upload"]').attachFile({
        fileContent: 'test image content',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
      });
      cy.wait('@uploadImage');

      // Verify image insertion
      cy.get('[data-testid="editor-content"]')
        .find('img')
        .should('have.attr', 'src', 'https://example.com/image.jpg')
        .and('have.attr', 'alt', 'Test image');
    });
  });

  describe('Tables', () => {
    it('should handle table operations', () => {
      // Insert table
      cy.get('[data-testid="insert-table"]').click();
      cy.get('[data-testid="table-rows"]').type('3');
      cy.get('[data-testid="table-columns"]').type('3');
      cy.get('[data-testid="create-table"]').click();

      // Add content to cells
      cy.get('[data-testid="editor-content"]').within(() => {
        cy.get('td').first().click().type('Cell 1');
        cy.get('td').eq(1).click().type('Cell 2');
      });

      // Verify table structure
      cy.get('[data-testid="editor-content"]').within(() => {
        cy.get('table').should('exist');
        cy.get('tr').should('have.length', 3);
        cy.get('td').should('have.length', 9);
      });
    });

    it('should handle table modifications', () => {
      // Insert initial table
      cy.get('[data-testid="insert-table"]').click();
      cy.get('[data-testid="table-rows"]').type('2');
      cy.get('[data-testid="table-columns"]').type('2');
      cy.get('[data-testid="create-table"]').click();

      // Add row
      cy.get('[data-testid="table-row-add"]').click();
      cy.get('tr').should('have.length', 3);

      // Add column
      cy.get('[data-testid="table-column-add"]').click();
      cy.get('td').should('have.length', 9);

      // Delete row
      cy.get('[data-testid="table-row-delete"]').click();
      cy.get('tr').should('have.length', 2);
    });
  });

  describe('Collaboration Features', () => {
    it('should handle concurrent editing', () => {
      // Mock WebSocket connection
      cy.window().then(win => {
        win.socketClient.emit('document:change', {
          userId: 2,
          username: 'collaborator',
          changes: {
            from: { line: 0, ch: 0 },
            to: { line: 0, ch: 15 },
            text: 'Updated content',
          },
        });
      });

      // Verify changes reflection
      cy.get('[data-testid="editor-content"]').should(
        'contain',
        'Updated content'
      );

      // Verify presence indicator
      cy.get('[data-testid="presence-indicator"]').should(
        'contain',
        'collaborator'
      );
    });

    it('should handle version conflicts', () => {
      // Mock version conflict
      cy.intercept('PUT', '/api/documents/1', {
        statusCode: 409,
        body: {
          error: 'Version conflict',
          currentVersion: 2,
        },
      }).as('versionConflict');

      // Make conflicting edit
      cy.get('[data-testid="editor-content"]').type(' additional content');
      cy.get('[data-testid="save-document"]').click();
      cy.wait('@versionConflict');

      // Verify conflict resolution dialog
      cy.get('[data-testid="conflict-dialog"]').should('be.visible');
      cy.get('[data-testid="resolve-conflict"]').click();
    });
  });

  describe('History and Versions', () => {
    it('should handle undo/redo', () => {
      // Type and format content
      cy.get('[data-testid="editor-content"]').clear().type('Test content');
      cy.get('[data-testid="format-bold"]').click();

      // Undo
      cy.get('[data-testid="undo"]').click();
      cy.get('[data-testid="editor-content"]')
        .find('strong')
        .should('not.exist');

      // Redo
      cy.get('[data-testid="redo"]').click();
      cy.get('[data-testid="editor-content"]').find('strong').should('exist');
    });

    it('should handle version history', () => {
      // Mock version history
      cy.intercept('GET', '/api/documents/1/history', {
        statusCode: 200,
        body: {
          versions: [
            {
              id: 2,
              timestamp: new Date().toISOString(),
              author: 'testuser',
              changes: 'Updated content',
            },
            {
              id: 1,
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              author: 'testuser',
              changes: 'Initial version',
            },
          ],
        },
      }).as('getHistory');

      // View history
      cy.get('[data-testid="view-history"]').click();
      cy.wait('@getHistory');

      // Verify history display
      cy.get('[data-testid="version-list"]').within(() => {
        cy.get('[data-testid="version-2"]').should(
          'contain',
          'Updated content'
        );
        cy.get('[data-testid="version-1"]').should(
          'contain',
          'Initial version'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors', () => {
      // Mock save error
      cy.intercept('PUT', '/api/documents/1', {
        statusCode: 500,
        body: {
          error: 'Failed to save document',
        },
      }).as('saveError');

      // Attempt save
      cy.get('[data-testid="editor-content"]').type(' new content');
      cy.get('[data-testid="save-document"]').click();
      cy.wait('@saveError');

      // Verify error handling
      cy.get('[data-testid="save-error"]')
        .should('be.visible')
        .and('contain', 'Failed to save document');
    });

    it('should handle image upload errors', () => {
      // Mock upload error
      cy.intercept('POST', '/api/documents/1/images', {
        statusCode: 500,
        body: {
          error: 'Image upload failed',
        },
      }).as('uploadError');

      // Attempt upload
      cy.get('[data-testid="insert-image"]').click();
      cy.get('[data-testid="image-upload"]').attachFile({
        fileContent: 'test image content',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
      });
      cy.wait('@uploadError');

      // Verify error handling
      cy.get('[data-testid="upload-error"]')
        .should('be.visible')
        .and('contain', 'Image upload failed');
    });
  });
});
