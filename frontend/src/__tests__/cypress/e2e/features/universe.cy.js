describe('Universe Features', () => {
  beforeEach(() => {
    // Setup mock responses for universe-related API calls
    cy.intercept('POST', '/api/universes', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'Test Description',
        isPublic: false,
        maxParticipants: 10,
      },
    }).as('createUniverse');

    cy.intercept('GET', '/api/universes', {
      statusCode: 200,
      body: {
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'Test Description',
            isPublic: false,
            maxParticipants: 10,
          },
        ],
      },
    }).as('getUniverses');

    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'Test Description',
        isPublic: false,
        maxParticipants: 10,
      },
    }).as('getUniverse');

    // Login before each test
    cy.login();
  });

  describe('Universe Creation', () => {
    it('should create a new universe with valid data', () => {
      cy.visit('/universes/create');

      // Fill out the form
      cy.get('[data-testid="universe-name"]').type('Test Universe');
      cy.get('[data-testid="universe-description"]').type('Test Description');
      cy.get('[data-testid="universe-max-participants"]').clear().type('10');
      cy.get('[data-testid="universe-public"]').click();

      // Submit the form
      cy.get('[data-testid="create-universe-submit"]').click();

      // Wait for API call and verify redirect
      cy.wait('@createUniverse');
      cy.url().should('include', '/universe/1');

      // Verify universe details are displayed
      cy.get('[data-testid="universe-title"]').should(
        'contain',
        'Test Universe'
      );
      cy.get('[data-testid="universe-description"]').should(
        'contain',
        'Test Description'
      );
    });

    it('should validate required fields', () => {
      cy.visit('/universes/create');

      // Try to submit empty form
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify validation messages
      cy.get('[data-testid="name-error"]').should('be.visible');
      cy.get('[data-testid="description-error"]').should('be.visible');
    });

    it('should handle API errors during creation', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 500,
        body: {
          error: 'Server error',
        },
      }).as('createUniverseError');

      cy.visit('/universes/create');

      // Fill out the form
      cy.get('[data-testid="universe-name"]').type('Test Universe');
      cy.get('[data-testid="universe-description"]').type('Test Description');

      // Submit the form
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Server error');
    });
  });

  describe('Universe Management', () => {
    it('should list all universes', () => {
      cy.visit('/universes');

      cy.wait('@getUniverses');

      // Verify universe list
      cy.get('[data-testid="universe-list"]')
        .should('be.visible')
        .within(() => {
          cy.get('[data-testid="universe-item"]').should('have.length', 1);
          cy.contains('Test Universe').should('be.visible');
        });
    });

    it('should view universe details', () => {
      cy.visit('/universes/1');

      cy.wait('@getUniverse');

      // Verify universe details
      cy.get('[data-testid="universe-title"]').should(
        'contain',
        'Test Universe'
      );
      cy.get('[data-testid="universe-description"]').should(
        'contain',
        'Test Description'
      );
      cy.get('[data-testid="universe-participants"]').should('contain', '10');
    });

    it('should edit universe settings', () => {
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Updated Universe',
          description: 'Updated Description',
          isPublic: true,
          maxParticipants: 20,
        },
      }).as('updateUniverse');

      cy.visit('/universes/1/edit');

      // Update form fields
      cy.get('[data-testid="universe-name"]').clear().type('Updated Universe');
      cy.get('[data-testid="universe-description"]')
        .clear()
        .type('Updated Description');
      cy.get('[data-testid="universe-max-participants"]').clear().type('20');

      // Submit changes
      cy.get('[data-testid="update-universe-submit"]').click();

      cy.wait('@updateUniverse');

      // Verify updates
      cy.get('[data-testid="universe-title"]').should(
        'contain',
        'Updated Universe'
      );
      cy.get('[data-testid="universe-description"]').should(
        'contain',
        'Updated Description'
      );
    });

    it('should delete a universe', () => {
      cy.intercept('DELETE', '/api/universes/1', {
        statusCode: 200,
      }).as('deleteUniverse');

      cy.visit('/universes/1');

      // Click delete button and confirm
      cy.get('[data-testid="delete-universe"]').click();
      cy.get('[data-testid="confirm-delete"]').click();

      cy.wait('@deleteUniverse');

      // Verify redirect to universes list
      cy.url().should('include', '/universes');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Universe deleted successfully'
      );
    });
  });

  describe('Universe Participation', () => {
    it('should join a public universe', () => {
      cy.intercept('POST', '/api/universes/1/join', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('joinUniverse');

      cy.visit('/universes/1');

      cy.get('[data-testid="join-universe"]').click();
      cy.wait('@joinUniverse');

      // Verify joined state
      cy.get('[data-testid="leave-universe"]').should('be.visible');
      cy.get('[data-testid="participant-count"]').should('contain', '1');
    });

    it('should leave a universe', () => {
      cy.intercept('POST', '/api/universes/1/leave', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('leaveUniverse');

      cy.visit('/universes/1');

      cy.get('[data-testid="leave-universe"]').click();
      cy.wait('@leaveUniverse');

      // Verify left state
      cy.get('[data-testid="join-universe"]').should('be.visible');
      cy.get('[data-testid="participant-count"]').should('contain', '0');
    });
  });
});
