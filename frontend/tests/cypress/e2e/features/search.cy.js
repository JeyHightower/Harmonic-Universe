describe('Search & Discovery Features', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock search results
    cy.intercept('GET', '/api/search*', {
      statusCode: 200,
      body: {
        results: [
          {
            id: 1,
            type: 'universe',
            name: 'Test Universe',
            description: 'A test universe with physics',
            owner: { id: 2, username: 'creator1' },
            tags: ['physics', 'simulation'],
            match_score: 0.95,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-20T12:00:00Z',
            preview_url: 'https://example.com/preview1.jpg',
          },
          {
            id: 2,
            type: 'storyboard',
            name: 'Physics Story',
            description: 'A storyboard about physics',
            owner: { id: 3, username: 'creator2' },
            tags: ['physics', 'education'],
            match_score: 0.85,
            created_at: '2024-01-10T12:00:00Z',
            updated_at: '2024-01-18T12:00:00Z',
            preview_url: 'https://example.com/preview2.jpg',
          },
        ],
        total: 2,
        page: 1,
        per_page: 10,
      },
    }).as('searchResults');

    // Mock popular tags
    cy.intercept('GET', '/api/tags/popular', {
      statusCode: 200,
      body: {
        tags: [
          { name: 'physics', count: 100 },
          { name: 'simulation', count: 80 },
          { name: 'education', count: 60 },
          { name: 'game', count: 40 },
          { name: 'music', count: 20 },
        ],
      },
    }).as('popularTags');

    // Mock recommendations
    cy.intercept('GET', '/api/recommendations', {
      statusCode: 200,
      body: {
        recommended: [
          {
            id: 3,
            type: 'universe',
            name: 'Recommended Universe',
            description: 'A universe you might like',
            owner: { id: 4, username: 'creator3' },
            tags: ['game', 'music'],
            match_score: 0.75,
            created_at: '2024-01-05T12:00:00Z',
            updated_at: '2024-01-17T12:00:00Z',
            preview_url: 'https://example.com/preview3.jpg',
          },
        ],
        trending: [
          {
            id: 4,
            type: 'universe',
            name: 'Trending Universe',
            description: 'A popular universe',
            owner: { id: 5, username: 'creator4' },
            tags: ['simulation', 'game'],
            views: 1000,
            likes: 500,
            created_at: '2024-01-01T12:00:00Z',
            updated_at: '2024-01-16T12:00:00Z',
            preview_url: 'https://example.com/preview4.jpg',
          },
        ],
      },
    }).as('recommendations');

    // Mock search history
    cy.intercept('GET', '/api/users/1/search-history', {
      statusCode: 200,
      body: {
        history: [
          {
            query: 'physics simulation',
            timestamp: '2024-01-20T11:00:00Z',
          },
          {
            query: 'music visualization',
            timestamp: '2024-01-19T10:00:00Z',
          },
        ],
      },
    }).as('searchHistory');

    // Login and navigate
    cy.login();
    cy.visit('/search');
    cy.wait(['@searchResults', '@popularTags', '@recommendations']);
  });

  describe('Basic Search', () => {
    it('should perform basic search', () => {
      cy.get('[data-testid="search-input"]').type('physics{enter}');
      cy.wait('@searchResults');

      cy.get('[data-testid="search-results"]').within(() => {
        // First result
        cy.get('[data-testid="result-1"]')
          .should('contain', 'Test Universe')
          .and('contain', 'creator1')
          .and('contain', 'physics')
          .and('contain', 'simulation');

        // Second result
        cy.get('[data-testid="result-2"]')
          .should('contain', 'Physics Story')
          .and('contain', 'creator2')
          .and('contain', 'physics')
          .and('contain', 'education');
      });
    });

    it('should display search suggestions', () => {
      cy.intercept('GET', '/api/search/suggestions?q=phys', {
        statusCode: 200,
        body: {
          suggestions: ['physics', 'physical simulation', 'physics game'],
        },
      }).as('searchSuggestions');

      cy.get('[data-testid="search-input"]').type('phys');
      cy.wait('@searchSuggestions');

      cy.get('[data-testid="search-suggestions"]').within(() => {
        cy.get('li').should('have.length', 3);
        cy.get('li').first().should('contain', 'physics');
      });
    });
  });

  describe('Filters and Sorting', () => {
    it('should apply filters', () => {
      // Type filter
      cy.get('[data-testid="type-filter"]').select('universe');
      cy.wait('@searchResults');
      cy.get('[data-testid="search-results"]')
        .find('[data-testid="result-1"]')
        .should('contain', 'Universe');

      // Tag filter
      cy.get('[data-testid="tag-filter"]').click();
      cy.get('[data-testid="tag-physics"]').click();
      cy.wait('@searchResults');
      cy.get('[data-testid="active-filters"]').should('contain', 'physics');

      // Date filter
      cy.get('[data-testid="date-filter"]').select('last_week');
      cy.wait('@searchResults');
    });

    it('should sort results', () => {
      cy.get('[data-testid="sort-select"]').select('most_recent');
      cy.wait('@searchResults');
      cy.get('[data-testid="search-results"]')
        .find('[data-testid="result-1"]')
        .should('contain', '2024-01-20');

      cy.get('[data-testid="sort-select"]').select('most_relevant');
      cy.wait('@searchResults');
      cy.get('[data-testid="search-results"]')
        .find('[data-testid="result-1"]')
        .should('contain', '0.95');
    });
  });

  describe('Pagination', () => {
    it('should handle pagination', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          results: [
            {
              id: 5,
              type: 'universe',
              name: 'Page 2 Universe',
              description: 'A universe on page 2',
              owner: { id: 6, username: 'creator5' },
              tags: ['physics'],
              match_score: 0.65,
              created_at: '2024-01-01T12:00:00Z',
            },
          ],
          total: 3,
          page: 2,
          per_page: 2,
        },
      }).as('page2Results');

      cy.get('[data-testid="next-page"]').click();
      cy.wait('@page2Results');
      cy.get('[data-testid="search-results"]')
        .find('[data-testid="result-5"]')
        .should('contain', 'Page 2 Universe');

      cy.get('[data-testid="pagination"]').within(() => {
        cy.get('[data-testid="current-page"]').should('contain', '2');
        cy.get('[data-testid="total-pages"]').should('contain', '2');
      });
    });
  });

  describe('Popular Tags', () => {
    it('should display popular tags', () => {
      cy.get('[data-testid="popular-tags"]').within(() => {
        cy.get('[data-testid="tag-physics"]')
          .should('contain', 'physics')
          .and('contain', '100');
        cy.get('[data-testid="tag-simulation"]')
          .should('contain', 'simulation')
          .and('contain', '80');
      });

      // Click tag to search
      cy.get('[data-testid="tag-physics"]').click();
      cy.wait('@searchResults');
      cy.get('[data-testid="search-input"]').should('have.value', 'physics');
    });
  });

  describe('Recommendations', () => {
    it('should display recommended content', () => {
      cy.get('[data-testid="recommendations"]').within(() => {
        cy.get('[data-testid="recommended-3"]')
          .should('contain', 'Recommended Universe')
          .and('contain', 'creator3');
      });
    });

    it('should display trending content', () => {
      cy.get('[data-testid="trending"]').within(() => {
        cy.get('[data-testid="trending-4"]')
          .should('contain', 'Trending Universe')
          .and('contain', 'creator4')
          .and('contain', '1000 views');
      });
    });
  });

  describe('Advanced Search', () => {
    it('should perform advanced search', () => {
      cy.get('[data-testid="advanced-search"]').click();

      // Fill advanced search form
      cy.get('[data-testid="search-name"]').type('test');
      cy.get('[data-testid="search-owner"]').type('creator');
      cy.get('[data-testid="search-tags"]').type('physics,simulation{enter}');
      cy.get('[data-testid="search-date-from"]').type('2024-01-01');
      cy.get('[data-testid="search-date-to"]').type('2024-01-20');

      cy.get('[data-testid="submit-advanced-search"]').click();
      cy.wait('@searchResults');

      cy.get('[data-testid="search-results"]')
        .find('[data-testid="result-1"]')
        .should('contain', 'Test Universe');
    });
  });

  describe('Search History', () => {
    it('should display search history', () => {
      cy.get('[data-testid="search-history"]').click();
      cy.wait('@searchHistory');

      cy.get('[data-testid="history-list"]').within(() => {
        cy.get('li')
          .first()
          .should('contain', 'physics simulation')
          .and('contain', '2024-01-20');
      });

      // Click history item to search
      cy.get('[data-testid="history-item-1"]').click();
      cy.wait('@searchResults');
      cy.get('[data-testid="search-input"]').should(
        'have.value',
        'physics simulation'
      );
    });

    it('should clear search history', () => {
      cy.intercept('DELETE', '/api/users/1/search-history', {
        statusCode: 204,
      }).as('clearHistory');

      cy.get('[data-testid="search-history"]').click();
      cy.get('[data-testid="clear-history"]').click();
      cy.wait('@clearHistory');

      cy.get('[data-testid="history-list"]').should('not.exist');
      cy.get('[data-testid="empty-history"]').should(
        'contain',
        'No search history'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 500,
        body: {
          error: 'Search service unavailable',
        },
      }).as('searchError');

      cy.get('[data-testid="search-input"]').type('test{enter}');
      cy.wait('@searchError');

      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Search service unavailable'
      );
    });

    it('should handle no results', () => {
      cy.intercept('GET', '/api/search*', {
        statusCode: 200,
        body: {
          results: [],
          total: 0,
          page: 1,
          per_page: 10,
        },
      }).as('emptyResults');

      cy.get('[data-testid="search-input"]').type('nonexistent{enter}');
      cy.wait('@emptyResults');

      cy.get('[data-testid="no-results"]').should(
        'contain',
        'No results found'
      );
    });
  });
});
