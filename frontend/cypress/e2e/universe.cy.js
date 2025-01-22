describe('Universe Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    }).then(response => {
      localStorage.setItem('token', response.body.token);
    });

    // Visit the home page
    cy.visit('/');
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.removeItem('token');
  });

  it('should create a new universe', () => {
    // Mock the create universe API response
    cy.intercept('POST', 'http://localhost:5000/api/universes', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe description',
        isPublic: true,
        allowGuests: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }).as('createUniverse');

    // Click the create universe button
    cy.get('[data-testid="create-universe-button"]').click();

    // Fill in the universe details
    cy.get('[data-testid="universe-name-input"]').type('Test Universe');
    cy.get('[data-testid="universe-description-input"]').type(
      'A test universe description'
    );
    cy.get('[data-testid="universe-public-toggle"]').click();
    cy.get('[data-testid="universe-guests-toggle"]').click();

    // Submit the form
    cy.get('[data-testid="create-universe-submit"]').click();

    // Wait for the API call to complete
    cy.wait('@createUniverse');

    // Verify that the universe card is displayed
    cy.get('[data-testid="universe-card"]').should('be.visible');
    cy.get('[data-testid="universe-card"]').should('contain', 'Test Universe');
  });

  it('should edit an existing universe', () => {
    // Mock the get universe API response
    cy.intercept('GET', 'http://localhost:5000/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe description',
        isPublic: true,
        allowGuests: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }).as('getUniverse');

    // Mock the update universe API response
    cy.intercept('PUT', 'http://localhost:5000/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Updated Universe',
        description: 'An updated universe description',
        isPublic: false,
        allowGuests: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }).as('updateUniverse');

    // Navigate to the universe
    cy.get('[data-testid="universe-card"]').click();
    cy.wait('@getUniverse');

    // Click the edit button
    cy.get('[data-testid="edit-universe-button"]').click();

    // Update the universe details
    cy.get('[data-testid="universe-name-input"]')
      .clear()
      .type('Updated Universe');
    cy.get('[data-testid="universe-description-input"]')
      .clear()
      .type('An updated universe description');
    cy.get('[data-testid="universe-public-toggle"]').click();
    cy.get('[data-testid="universe-guests-toggle"]').click();

    // Submit the form
    cy.get('[data-testid="edit-universe-submit"]').click();

    // Wait for the API call to complete
    cy.wait('@updateUniverse');

    // Verify that the universe details are updated
    cy.get('[data-testid="universe-name"]').should(
      'contain',
      'Updated Universe'
    );
    cy.get('[data-testid="universe-description"]').should(
      'contain',
      'An updated universe description'
    );
  });

  it('should delete a universe', () => {
    // Mock the get universe API response
    cy.intercept('GET', 'http://localhost:5000/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe description',
        isPublic: true,
        allowGuests: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }).as('getUniverse');

    // Mock the delete universe API response
    cy.intercept('DELETE', 'http://localhost:5000/api/universes/1', {
      statusCode: 200,
    }).as('deleteUniverse');

    // Navigate to the universe
    cy.get('[data-testid="universe-card"]').click();
    cy.wait('@getUniverse');

    // Click the delete button
    cy.get('[data-testid="delete-universe-button"]').click();

    // Confirm deletion
    cy.get('[data-testid="confirm-delete-button"]').click();

    // Wait for the API call to complete
    cy.wait('@deleteUniverse');

    // Verify that the universe is removed
    cy.get('[data-testid="universe-card"]').should('not.exist');
  });

  it('should join a public universe', () => {
    // Mock the get universes API response
    cy.intercept('GET', 'http://localhost:5000/api/universes', {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: 'Public Universe',
          description: 'A public universe description',
          isPublic: true,
          allowGuests: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }).as('getUniverses');

    // Mock the join universe API response
    cy.intercept('POST', 'http://localhost:5000/api/universes/1/join', {
      statusCode: 200,
      body: {
        success: true,
      },
    }).as('joinUniverse');

    // Wait for the universes to load
    cy.wait('@getUniverses');

    // Click the join button
    cy.get('[data-testid="join-universe-button"]').click();

    // Wait for the API call to complete
    cy.wait('@joinUniverse');

    // Verify that the user is now a member
    cy.get('[data-testid="member-badge"]').should('be.visible');
  });

  it('should handle errors when creating a universe', () => {
    // Mock the create universe API response with an error
    cy.intercept('POST', 'http://localhost:5000/api/universes', {
      statusCode: 400,
      body: {
        error: 'Name is required',
      },
    }).as('createUniverseError');

    // Click the create universe button
    cy.get('[data-testid="create-universe-button"]').click();

    // Submit the form without filling in required fields
    cy.get('[data-testid="create-universe-submit"]').click();

    // Wait for the API call to complete
    cy.wait('@createUniverseError');

    // Verify that error messages are displayed
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Name is required'
    );
  });
});
