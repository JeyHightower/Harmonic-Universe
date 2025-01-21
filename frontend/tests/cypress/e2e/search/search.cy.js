describe('Search & Discovery', () => {
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
            type: 'universe',
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            owner: { id: 1, username: 'testuser' },
            tags: ['physics', 'particles'],
            created_at: '2024-01-20T12:00:00Z',
            match_score: 0.95,
          },
          {
            type: 'storyboard',
            id: 1,
            title: 'Test Storyboard',
            description: 'A test storyboard',
            owner: { id: 2, username: 'otheruser' },
            tags: ['animation', 'music'],
            created_at: '2024-01-19T12:00:00Z',
            match_score: 0.85,
          },
        ],
        total: 2,
        page: 1,
        per_page: 10,
      },
    }).as('search');

    // Mock popular tags
    cy.intercept('GET', '/api/tags/popular', {
      statusCode: 200,
      body: {
        tags: [
          { name: 'physics', count: 100 },
          { name: 'particles', count: 80 },
          { name: 'music', count: 60 },
          { name: 'animation', count: 40 },
        ],
      },
    }).as('getTags');

    // Mock recommendations
    cy.intercept('GET', '/api/recommendations', {
      statusCode: 200,
      body: {
        universes: [
          {
            id: 2,
            name: 'Recommended Universe',
            description: 'Based on your interests',
            owner: { id: 3, username: 'creator' },
            tags: ['physics', 'music'],
            match_score: 0.9,
          },
        ],
        creators: [
          {
            id: 3,
            username: 'creator',
            bio: 'Creates amazing universes',
            follower_count: 1000,
          },
        ],
      },
    }).as('getRecommendations');

    // Login and navigate
    cy.login();
    cy.visit('/search');
    cy.wait(['@getTags', '@getRecommendations']);
  });

  it('should handle basic search', () => {
    // Test search input
    cy.get('[data-testid="search-input"]').type('test{enter}');
    cy.wait('@search');

    // Verify results
    cy.get('[data-testid="search-results"]').within(() => {
      cy.get('[data-testid="result-universe-1"]').should(
        'contain',
        'Test Universe'
      );
      cy.get('[data-testid="result-storyboard-1"]').should(
        'contain',
        'Test Storyboard'
      );
    });
  });

  it('should handle filters', () => {
    // Mock filtered results
    cy.intercept('GET', '/api/search*type=universe*', {
      statusCode: 200,
      body: {
        results: [
          {
            type: 'universe',
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            owner: { id: 1, username: 'testuser' },
            tags: ['physics', 'particles'],
            created_at: '2024-01-20T12:00:00Z',
            match_score: 0.95,
          },
        ],
        total: 1,
        page: 1,
        per_page: 10,
      },
    }).as('filteredSearch');

    // Apply filters
    cy.get('[data-testid="filter-type"]').select('universe');
    cy.get('[data-testid="filter-date"]').select('past-week');
    cy.get('[data-testid="filter-tag"]').select('physics');
    cy.get('[data-testid="apply-filters"]').click();

    cy.wait('@filteredSearch');
    cy.get('[data-testid="search-results"]').should('contain', 'Test Universe');
    cy.get('[data-testid="result-storyboard-1"]').should('not.exist');
  });

  it('should handle sorting', () => {
    // Mock sorted results
    cy.intercept('GET', '/api/search*sort=recent*', {
      statusCode: 200,
      body: {
        results: [
          {
            type: 'universe',
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            created_at: '2024-01-20T12:00:00Z',
          },
          {
            type: 'storyboard',
            id: 1,
            title: 'Test Storyboard',
            description: 'A test storyboard',
            created_at: '2024-01-19T12:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        per_page: 10,
      },
    }).as('sortedSearch');

    cy.get('[data-testid="sort-by"]').select('recent');
    cy.wait('@sortedSearch');

    // Verify sort order
    cy.get('[data-testid="search-results"]')
      .children()
      .first()
      .should('contain', 'Test Universe');
  });

  it('should handle pagination', () => {
    // Mock second page
    cy.intercept('GET', '/api/search*page=2*', {
      statusCode: 200,
      body: {
        results: [
          {
            type: 'universe',
            id: 3,
            name: 'Another Universe',
            description: 'Page 2 result',
            created_at: '2024-01-18T12:00:00Z',
          },
        ],
        total: 3,
        page: 2,
        per_page: 2,
      },
    }).as('pageTwo');

    cy.get('[data-testid="next-page"]').click();
    cy.wait('@pageTwo');

    cy.get('[data-testid="search-results"]').should(
      'contain',
      'Another Universe'
    );
    cy.get('[data-testid="current-page"]').should('contain', '2');
  });

  it('should display popular tags', () => {
    cy.get('[data-testid="popular-tags"]').within(() => {
      cy.get('[data-testid="tag-physics"]')
        .should('contain', 'physics')
        .and('contain', '100');
      cy.get('[data-testid="tag-particles"]')
        .should('contain', 'particles')
        .and('contain', '80');
    });

    // Test tag selection
    cy.get('[data-testid="tag-physics"]').click();
    cy.get('[data-testid="active-filters"]').should('contain', 'physics');
  });

  it('should display recommendations', () => {
    cy.get('[data-testid="recommendations"]').within(() => {
      // Universe recommendations
      cy.get('[data-testid="recommended-universes"]').should(
        'contain',
        'Recommended Universe'
      );

      // Creator recommendations
      cy.get('[data-testid="recommended-creators"]')
        .should('contain', 'creator')
        .and('contain', '1000 followers');
    });
  });

  it('should handle advanced search', () => {
    // Mock advanced search results
    cy.intercept('POST', '/api/search/advanced', {
      statusCode: 200,
      body: {
        results: [
          {
            type: 'universe',
            id: 1,
            name: 'Advanced Test Universe',
            description: 'Matches advanced criteria',
            physics_params: {
              gravity: 9.8,
              particles: 1000,
            },
            audio_params: {
              harmony: 0.7,
              rhythm: 0.5,
            },
            created_at: '2024-01-20T12:00:00Z',
          },
        ],
        total: 1,
      },
    }).as('advancedSearch');

    // Open advanced search
    cy.get('[data-testid="advanced-search"]').click();

    // Configure physics parameters
    cy.get('[data-testid="physics-gravity-min"]').type('9.0');
    cy.get('[data-testid="physics-gravity-max"]').type('10.0');
    cy.get('[data-testid="physics-particles-min"]').type('500');

    // Configure audio parameters
    cy.get('[data-testid="audio-harmony-min"]').type('0.6');
    cy.get('[data-testid="audio-rhythm-min"]').type('0.4');

    // Apply advanced search
    cy.get('[data-testid="apply-advanced-search"]').click();

    cy.wait('@advancedSearch');
    cy.get('[data-testid="search-results"]').should(
      'contain',
      'Advanced Test Universe'
    );
  });

  it('should handle search history', () => {
    // Mock search history
    cy.intercept('GET', '/api/search/history', {
      statusCode: 200,
      body: {
        searches: [
          {
            query: 'previous search',
            timestamp: '2024-01-19T12:00:00Z',
            filters: { type: 'universe' },
          },
        ],
      },
    }).as('getHistory');

    cy.get('[data-testid="search-history"]').click();
    cy.wait('@getHistory');

    // View history
    cy.get('[data-testid="history-list"]').should('contain', 'previous search');

    // Reuse search
    cy.get('[data-testid="reuse-search"]').first().click();
    cy.get('[data-testid="search-input"]').should(
      'have.value',
      'previous search'
    );
    cy.get('[data-testid="filter-type"]').should('have.value', 'universe');
  });

  it('should handle error states', () => {
    // Test search error
    cy.intercept('GET', '/api/search*', {
      statusCode: 500,
      body: {
        error: 'Search service unavailable',
      },
    }).as('searchError');

    cy.get('[data-testid="search-input"]').type('error test{enter}');
    cy.wait('@searchError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Search service unavailable'
    );

    // Test filter error
    cy.intercept('GET', '/api/search*type=invalid*', {
      statusCode: 400,
      body: {
        error: 'Invalid filter parameters',
      },
    }).as('filterError');

    cy.get('[data-testid="filter-type"]').select('universe');
    cy.get('[data-testid="apply-filters"]').click();
    cy.wait('@filterError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Invalid filter parameters'
    );
  });
});
