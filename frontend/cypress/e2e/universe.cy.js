describe('Universe Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('creates a new universe', () => {
    cy.visit('/universe/create');

    // Fill in universe details
    cy.get('input[name="name"]').type('Test Universe');
    cy.get('textarea[name="description"]').type('A test universe description');
    cy.get('input[name="gravity"]').type('9.81');
    cy.get('input[name="timeDilation"]').type('1.0');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Verify success
    cy.contains('Universe created successfully');
    cy.url().should('match', /\/universe\/\d+/);
  });

  it('edits an existing universe', () => {
    // Create a universe first
    cy.request({
      method: 'POST',
      url: '/api/universes',
      body: {
        name: 'Universe to Edit',
        description: 'Initial description',
        physics_parameters: {
          gravity: 9.81,
          time_dilation: 1.0,
        },
      },
    }).then(response => {
      const universeId = response.body.id;

      // Visit edit page
      cy.visit(`/universe/${universeId}/edit`);

      // Update details
      cy.get('input[name="name"]').clear().type('Updated Universe');
      cy.get('textarea[name="description"]')
        .clear()
        .type('Updated description');
      cy.get('input[name="gravity"]').clear().type('8.9');

      // Submit changes
      cy.get('button[type="submit"]').click();

      // Verify updates
      cy.contains('Universe updated successfully');
      cy.contains('Updated Universe');
      cy.contains('Updated description');
    });
  });

  it('deletes a universe', () => {
    // Create a universe first
    cy.request({
      method: 'POST',
      url: '/api/universes',
      body: {
        name: 'Universe to Delete',
        description: 'To be deleted',
        physics_parameters: {
          gravity: 9.81,
          time_dilation: 1.0,
        },
      },
    }).then(response => {
      const universeId = response.body.id;

      // Visit universe page
      cy.visit(`/universe/${universeId}`);

      // Click delete button
      cy.get('button[aria-label="Delete Universe"]').click();

      // Confirm deletion
      cy.get('button').contains('Confirm').click();

      // Verify deletion
      cy.contains('Universe deleted successfully');
      cy.url().should('eq', Cypress.config().baseUrl + '/universes');
    });
  });

  it('manages collaborators', () => {
    // Create a universe first
    cy.request({
      method: 'POST',
      url: '/api/universes',
      body: {
        name: 'Collaborative Universe',
        description: 'Testing collaboration',
        physics_parameters: {
          gravity: 9.81,
          time_dilation: 1.0,
        },
      },
    }).then(response => {
      const universeId = response.body.id;

      // Visit collaborators page
      cy.visit(`/universe/${universeId}/collaborators`);

      // Add collaborator
      cy.get('input[name="email"]').type('collaborator@example.com');
      cy.get('select[name="role"]').select('editor');
      cy.get('button').contains('Add Collaborator').click();

      // Verify collaborator added
      cy.contains('collaborator@example.com');
      cy.contains('editor');

      // Change role
      cy.get('select[aria-label="Change Role"]').select('viewer');
      cy.contains('Role updated successfully');

      // Remove collaborator
      cy.get('button[aria-label="Remove Collaborator"]').click();
      cy.get('button').contains('Confirm').click();
      cy.contains('Collaborator removed successfully');
    });
  });

  it('handles validation errors', () => {
    cy.visit('/universe/create');

    // Submit empty form
    cy.get('button[type="submit"]').click();

    // Verify validation messages
    cy.contains('Name is required');
    cy.contains('Description is required');

    // Test invalid physics parameters
    cy.get('input[name="gravity"]').type('-1');
    cy.get('input[name="timeDilation"]').type('0');
    cy.get('button[type="submit"]').click();

    cy.contains('Gravity must be positive');
    cy.contains('Time dilation must be greater than zero');
  });
});
