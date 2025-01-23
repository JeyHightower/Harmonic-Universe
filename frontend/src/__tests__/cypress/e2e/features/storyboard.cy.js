describe('Storyboard Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('login');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'Test Description',
        owner: { id: 1, username: 'testuser' },
        storyboards: [
          {
            id: 1,
            title: 'Test Storyboard',
            content: 'Test Content',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    }).as('getUniverse');

    // Mock storyboard list
    cy.intercept('GET', '/api/universes/1/storyboards', {
      statusCode: 200,
      body: {
        storyboards: [
          {
            id: 1,
            title: 'Test Storyboard',
            content: 'Test Content',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    }).as('getStoryboards');

    cy.visit('/universes/1/storyboards');
  });

  describe('Storyboard List', () => {
    it('should display storyboard list', () => {
      cy.wait('@getStoryboards');
      cy.get('[data-testid="storyboard-list"]').should('be.visible');
      cy.get('[data-testid="storyboard-item"]').should('have.length', 1);
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'Test Storyboard');
    });

    it('should handle empty storyboard list', () => {
      cy.intercept('GET', '/api/universes/1/storyboards', {
        statusCode: 200,
        body: { storyboards: [] },
      }).as('getEmptyStoryboards');

      cy.visit('/universes/1/storyboards');
      cy.wait('@getEmptyStoryboards');
      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.get('[data-testid="empty-state"]').should(
        'contain',
        'No storyboards yet'
      );
    });

    it('should handle storyboard list loading state', () => {
      cy.intercept('GET', '/api/universes/1/storyboards', req => {
        req.delay(1000);
        req.reply({
          statusCode: 200,
          body: { storyboards: [] },
        });
      }).as('getDelayedStoryboards');

      cy.visit('/universes/1/storyboards');
      cy.get('[data-testid="loading-state"]').should('be.visible');
      cy.wait('@getDelayedStoryboards');
      cy.get('[data-testid="loading-state"]').should('not.exist');
    });
  });

  describe('Storyboard Creation', () => {
    it('should create new storyboard', () => {
      cy.intercept('POST', '/api/universes/1/storyboards', {
        statusCode: 201,
        body: {
          storyboard: {
            id: 2,
            title: 'New Storyboard',
            content: 'New Content',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      }).as('createStoryboard');

      cy.get('[data-testid="create-storyboard"]').click();
      cy.get('[data-testid="storyboard-title"]').type('New Storyboard');
      cy.get('[data-testid="storyboard-content"]').type('New Content');
      cy.get('[data-testid="submit-storyboard"]').click();

      cy.wait('@createStoryboard');
      cy.get('[data-testid="storyboard-item"]').should('have.length', 2);
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'New Storyboard');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="create-storyboard"]').click();
      cy.get('[data-testid="submit-storyboard"]').click();

      cy.get('[data-testid="title-error"]').should('be.visible');
      cy.get('[data-testid="content-error"]').should('be.visible');
    });

    it('should handle creation errors', () => {
      cy.intercept('POST', '/api/universes/1/storyboards', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('createStoryboardError');

      cy.get('[data-testid="create-storyboard"]').click();
      cy.get('[data-testid="storyboard-title"]').type('New Storyboard');
      cy.get('[data-testid="storyboard-content"]').type('New Content');
      cy.get('[data-testid="submit-storyboard"]').click();

      cy.wait('@createStoryboardError');
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Server error');
    });
  });

  describe('Storyboard Editing', () => {
    it('should edit existing storyboard', () => {
      cy.intercept('PUT', '/api/universes/1/storyboards/1', {
        statusCode: 200,
        body: {
          storyboard: {
            id: 1,
            title: 'Updated Storyboard',
            content: 'Updated Content',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      }).as('updateStoryboard');

      cy.get('[data-testid="storyboard-item"]').first().click();
      cy.get('[data-testid="edit-storyboard"]').click();
      cy.get('[data-testid="storyboard-title"]')
        .clear()
        .type('Updated Storyboard');
      cy.get('[data-testid="storyboard-content"]')
        .clear()
        .type('Updated Content');
      cy.get('[data-testid="submit-storyboard"]').click();

      cy.wait('@updateStoryboard');
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'Updated Storyboard');
    });

    it('should handle edit validation', () => {
      cy.get('[data-testid="storyboard-item"]').first().click();
      cy.get('[data-testid="edit-storyboard"]').click();
      cy.get('[data-testid="storyboard-title"]').clear();
      cy.get('[data-testid="storyboard-content"]').clear();
      cy.get('[data-testid="submit-storyboard"]').click();

      cy.get('[data-testid="title-error"]').should('be.visible');
      cy.get('[data-testid="content-error"]').should('be.visible');
    });

    it('should handle edit errors', () => {
      cy.intercept('PUT', '/api/universes/1/storyboards/1', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('updateStoryboardError');

      cy.get('[data-testid="storyboard-item"]').first().click();
      cy.get('[data-testid="edit-storyboard"]').click();
      cy.get('[data-testid="storyboard-title"]')
        .clear()
        .type('Updated Storyboard');
      cy.get('[data-testid="submit-storyboard"]').click();

      cy.wait('@updateStoryboardError');
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Server error');
    });
  });

  describe('Storyboard Deletion', () => {
    it('should delete storyboard', () => {
      cy.intercept('DELETE', '/api/universes/1/storyboards/1', {
        statusCode: 204,
      }).as('deleteStoryboard');

      cy.get('[data-testid="storyboard-item"]').first().click();
      cy.get('[data-testid="delete-storyboard"]').click();
      cy.get('[data-testid="confirm-delete"]').click();

      cy.wait('@deleteStoryboard');
      cy.get('[data-testid="storyboard-item"]').should('have.length', 0);
      cy.get('[data-testid="empty-state"]').should('be.visible');
    });

    it('should handle delete errors', () => {
      cy.intercept('DELETE', '/api/universes/1/storyboards/1', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('deleteStoryboardError');

      cy.get('[data-testid="storyboard-item"]').first().click();
      cy.get('[data-testid="delete-storyboard"]').click();
      cy.get('[data-testid="confirm-delete"]').click();

      cy.wait('@deleteStoryboardError');
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Server error');
    });

    it('should cancel delete operation', () => {
      cy.get('[data-testid="storyboard-item"]').first().click();
      cy.get('[data-testid="delete-storyboard"]').click();
      cy.get('[data-testid="cancel-delete"]').click();

      cy.get('[data-testid="storyboard-item"]').should('have.length', 1);
    });
  });

  describe('Storyboard Search and Filtering', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/universes/1/storyboards*', {
        statusCode: 200,
        body: {
          storyboards: [
            {
              id: 1,
              title: 'First Storyboard',
              content: 'First Content',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Second Storyboard',
              content: 'Second Content',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
      }).as('searchStoryboards');
    });

    it('should filter storyboards by search term', () => {
      cy.get('[data-testid="search-input"]').type('First');
      cy.wait('@searchStoryboards');
      cy.get('[data-testid="storyboard-item"]').should('have.length', 1);
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'First Storyboard');
    });

    it('should handle no search results', () => {
      cy.intercept('GET', '/api/universes/1/storyboards*', {
        statusCode: 200,
        body: { storyboards: [] },
      }).as('emptySearchResults');

      cy.get('[data-testid="search-input"]').type('Nonexistent');
      cy.wait('@emptySearchResults');
      cy.get('[data-testid="empty-search"]').should('be.visible');
      cy.get('[data-testid="empty-search"]').should(
        'contain',
        'No results found'
      );
    });

    it('should debounce search input', () => {
      cy.intercept('GET', '/api/universes/1/storyboards*', req => {
        req.reply({
          statusCode: 200,
          body: { storyboards: [] },
        });
      }).as('debouncedSearch');

      cy.get('[data-testid="search-input"]').type('Test');
      cy.get('[data-testid="search-input"]').type(' Query');

      // Should only make one request after debounce
      cy.get('@debouncedSearch.all').should('have.length', 1);
    });
  });

  describe('Storyboard Sorting', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/universes/1/storyboards*', {
        statusCode: 200,
        body: {
          storyboards: [
            {
              id: 1,
              title: 'A Storyboard',
              content: 'Content A',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 2,
              title: 'B Storyboard',
              content: 'Content B',
              created_at: '2024-01-02T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          ],
        },
      }).as('sortStoryboards');
    });

    it('should sort storyboards by title', () => {
      cy.get('[data-testid="sort-select"]').select('title');
      cy.wait('@sortStoryboards');
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'A Storyboard');
    });

    it('should sort storyboards by date', () => {
      cy.get('[data-testid="sort-select"]').select('date');
      cy.wait('@sortStoryboards');
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'B Storyboard');
    });

    it('should toggle sort direction', () => {
      cy.get('[data-testid="sort-select"]').select('title');
      cy.get('[data-testid="sort-direction"]').click();
      cy.wait('@sortStoryboards');
      cy.get('[data-testid="storyboard-item"]')
        .first()
        .should('contain', 'B Storyboard');
    });
  });
});
