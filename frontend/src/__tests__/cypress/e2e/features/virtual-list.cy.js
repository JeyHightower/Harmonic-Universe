describe('Virtual List and Batch Operations', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock initial list data
    cy.intercept('GET', '/api/universes*', {
      statusCode: 200,
      body: {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Universe ${i + 1}`,
          description: `Description for Universe ${i + 1}`,
          createdAt: new Date().toISOString(),
          owner: { id: 1, username: 'testuser' },
        })),
        total: 1000,
        hasMore: true,
      },
    }).as('getItems');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universes');
    cy.wait('@getItems');
  });

  describe('Virtual List Rendering', () => {
    it('should handle initial render', () => {
      // Verify initial items
      cy.get('[data-testid="virtual-list"]').within(() => {
        cy.get('[data-testid="list-item"]').should('have.length.at.least', 10);
        cy.get('[data-testid="list-item"]')
          .first()
          .should('contain', 'Universe 1');
      });

      // Verify scroll container
      cy.get('[data-testid="virtual-scroll-container"]')
        .should('have.attr', 'style')
        .and('include', 'height');
    });

    it('should handle scrolling', () => {
      // Mock next page
      cy.intercept('GET', '/api/universes?offset=100', {
        statusCode: 200,
        body: {
          items: Array.from({ length: 100 }, (_, i) => ({
            id: i + 101,
            name: `Universe ${i + 101}`,
          })),
          total: 1000,
          hasMore: true,
        },
      }).as('getNextPage');

      // Scroll down
      cy.get('[data-testid="virtual-scroll-container"]').scrollTo('bottom');
      cy.wait('@getNextPage');

      // Verify new items
      cy.get('[data-testid="list-item"]').should('contain', 'Universe 101');
    });

    it('should handle dynamic item heights', () => {
      // Toggle item expansion
      cy.get('[data-testid="list-item"]').first().click();

      // Verify container adjustment
      cy.get('[data-testid="list-item"]')
        .first()
        .should('have.class', 'expanded')
        .and('have.attr', 'style')
        .and('include', 'height');

      // Verify list recalculation
      cy.get('[data-testid="virtual-scroll-container"]')
        .should('have.attr', 'style')
        .and('include', 'height');
    });
  });

  describe('Batch Operations', () => {
    it('should handle item selection', () => {
      // Select multiple items
      cy.get('[data-testid="select-item-1"]').click();
      cy.get('[data-testid="select-item-2"]').click();
      cy.get('[data-testid="select-item-3"]').click();

      // Verify selection state
      cy.get('[data-testid="selected-count"]').should('contain', '3');
      cy.get('[data-testid="batch-operations"]').should('be.visible');
    });

    it('should handle bulk selection', () => {
      // Select all visible items
      cy.get('[data-testid="select-all"]').click();

      // Verify selection
      cy.get('[data-testid="list-item"]').each($item => {
        cy.wrap($item)
          .find('[data-testid="item-checkbox"]')
          .should('be.checked');
      });

      // Verify selection count
      cy.get('[data-testid="selected-count"]').should('contain', '100');
    });

    it('should handle batch delete', () => {
      // Mock batch delete
      cy.intercept('DELETE', '/api/universes/batch', {
        statusCode: 200,
        body: {
          deleted: [1, 2, 3],
          failed: [],
        },
      }).as('batchDelete');

      // Select items
      cy.get('[data-testid="select-item-1"]').click();
      cy.get('[data-testid="select-item-2"]').click();
      cy.get('[data-testid="select-item-3"]').click();

      // Perform batch delete
      cy.get('[data-testid="batch-delete"]').click();
      cy.get('[data-testid="confirm-delete"]').click();
      cy.wait('@batchDelete');

      // Verify deletion
      cy.get('[data-testid="list-item-1"]').should('not.exist');
      cy.get('[data-testid="list-item-2"]').should('not.exist');
      cy.get('[data-testid="list-item-3"]').should('not.exist');
    });

    it('should handle batch update', () => {
      // Mock batch update
      cy.intercept('PUT', '/api/universes/batch', {
        statusCode: 200,
        body: {
          updated: [1, 2],
          failed: [],
        },
      }).as('batchUpdate');

      // Select items
      cy.get('[data-testid="select-item-1"]').click();
      cy.get('[data-testid="select-item-2"]').click();

      // Perform batch update
      cy.get('[data-testid="batch-update"]').click();
      cy.get('[data-testid="update-visibility"]').select('private');
      cy.get('[data-testid="apply-update"]').click();
      cy.wait('@batchUpdate');

      // Verify update
      cy.get('[data-testid="list-item-1"]').should('have.class', 'private');
      cy.get('[data-testid="list-item-2"]').should('have.class', 'private');
    });
  });

  describe('List Operations', () => {
    it('should handle sorting', () => {
      // Mock sorted data
      cy.intercept('GET', '/api/universes?sort=name', {
        statusCode: 200,
        body: {
          items: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `Sorted Universe ${i + 1}`,
          })),
          total: 1000,
          hasMore: true,
        },
      }).as('getSorted');

      // Apply sort
      cy.get('[data-testid="sort-by"]').select('name');
      cy.wait('@getSorted');

      // Verify sorted items
      cy.get('[data-testid="list-item"]')
        .first()
        .should('contain', 'Sorted Universe 1');
    });

    it('should handle filtering', () => {
      // Mock filtered data
      cy.intercept('GET', '/api/universes?filter=test', {
        statusCode: 200,
        body: {
          items: [
            {
              id: 1,
              name: 'Test Universe',
              description: 'Test Description',
            },
          ],
          total: 1,
          hasMore: false,
        },
      }).as('getFiltered');

      // Apply filter
      cy.get('[data-testid="filter-input"]').type('test');
      cy.wait('@getFiltered');

      // Verify filtered items
      cy.get('[data-testid="list-item"]')
        .should('have.length', 1)
        .and('contain', 'Test Universe');
    });
  });

  describe('Performance Optimization', () => {
    it('should handle large datasets', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/universes?limit=1000', {
        statusCode: 200,
        body: {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            name: `Universe ${i + 1}`,
          })),
          total: 1000,
          hasMore: false,
        },
      }).as('getLarge');

      // Load large dataset
      cy.get('[data-testid="load-all"]').click();
      cy.wait('@getLarge');

      // Verify smooth scrolling
      cy.get('[data-testid="virtual-scroll-container"]').scrollTo('bottom', {
        duration: 1000,
      });
      cy.get('[data-testid="list-item"]').should('have.length.at.least', 10);
    });

    it('should handle window resizing', () => {
      // Resize viewport
      cy.viewport(1920, 1080);

      // Verify list adjustment
      cy.get('[data-testid="virtual-scroll-container"]')
        .should('have.attr', 'style')
        .and('include', 'height');

      // Verify visible items
      cy.get('[data-testid="list-item"]').should('have.length.at.least', 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle load errors', () => {
      // Mock load error
      cy.intercept('GET', '/api/universes*', {
        statusCode: 500,
        body: {
          error: 'Failed to load items',
        },
      }).as('loadError');

      // Reload list
      cy.get('[data-testid="refresh-list"]').click();
      cy.wait('@loadError');

      // Verify error handling
      cy.get('[data-testid="load-error"]')
        .should('be.visible')
        .and('contain', 'Failed to load items');
    });

    it('should handle batch operation errors', () => {
      // Mock batch operation error
      cy.intercept('PUT', '/api/universes/batch', {
        statusCode: 500,
        body: {
          error: 'Batch operation failed',
          failed: [1, 2],
        },
      }).as('batchError');

      // Select items
      cy.get('[data-testid="select-item-1"]').click();
      cy.get('[data-testid="select-item-2"]').click();

      // Attempt batch operation
      cy.get('[data-testid="batch-update"]').click();
      cy.get('[data-testid="update-visibility"]').select('private');
      cy.get('[data-testid="apply-update"]').click();
      cy.wait('@batchError');

      // Verify error handling
      cy.get('[data-testid="batch-error"]')
        .should('be.visible')
        .and('contain', 'Batch operation failed');
      cy.get('[data-testid="failed-items"]').should(
        'contain',
        '2 items failed'
      );
    });
  });
});
