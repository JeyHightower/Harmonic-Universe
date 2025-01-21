describe('Universe Features', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/universes');
  });

  it('should display universe list', () => {
    cy.get('.universe-card').should('have.length.at.least', 1);
    cy.get('.universe-card').first().should('contain', 'Test Universe');
  });

  it('should create a new universe', () => {
    cy.get('.create-universe-button').click();
    cy.get('input[name="name"]').type('New Test Universe');
    cy.get('textarea[name="description"]').type(
      'This is a test universe description'
    );
    cy.get('input[name="isPublic"]').check();
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/universes');
    cy.get('.universe-card').should('contain', 'New Test Universe');
  });

  it('should edit an existing universe', () => {
    cy.get('.universe-card').first().click();
    cy.get('.edit-button').click();
    cy.get('input[name="name"]').clear().type('Updated Universe Name');
    cy.get('textarea[name="description"]').clear().type('Updated description');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/universes');
    cy.get('.universe-card').should('contain', 'Updated Universe Name');
  });

  it('should delete a universe', () => {
    cy.createUniverse(
      'Universe to Delete',
      'This universe will be deleted',
      true
    );
    cy.reload();
    cy.get('.universe-card')
      .contains('Universe to Delete')
      .parent()
      .find('.delete-button')
      .click();
    cy.get('.confirm-delete-button').click();
    cy.get('.universe-card').should('not.contain', 'Universe to Delete');
  });

  it('should filter universes', () => {
    cy.get('.search-input').type('Test');
    cy.get('.universe-card').should('have.length.at.least', 1);
    cy.get('.universe-card').each($card => {
      cy.wrap($card).should('contain', 'Test');
    });
  });

  it('should handle pagination', () => {
    // Create multiple universes to test pagination
    for (let i = 1; i <= 12; i++) {
      cy.createUniverse(`Test Universe ${i}`, `Description ${i}`, true);
    }
    cy.reload();

    cy.get('.universe-card').should('have.length', 10); // Assuming 10 per page
    cy.get('.pagination-next').click();
    cy.get('.universe-card').should('have.length.at.least', 1);
    cy.get('.pagination-prev').should('exist');
  });

  it('should show universe details', () => {
    cy.get('.universe-card').first().click();
    cy.url().should('include', '/universe/');
    cy.get('.universe-title').should('exist');
    cy.get('.universe-description').should('exist');
    cy.get('.universe-author').should('exist');
    cy.get('.universe-created-at').should('exist');
  });

  it('should handle WebSocket updates', () => {
    cy.mockWebSocket();
    cy.createUniverse(
      'WebSocket Test Universe',
      'Testing real-time updates',
      true
    );
    cy.get('.universe-card').should('contain', 'WebSocket Test Universe');

    // Simulate receiving a WebSocket update
    cy.window().then(win => {
      win.dispatchEvent(
        new CustomEvent('universe-update', {
          detail: {
            type: 'update',
            data: {
              id: 1,
              name: 'Updated via WebSocket',
              description: 'Real-time update test',
            },
          },
        })
      );
    });

    cy.get('.universe-card').should('contain', 'Updated via WebSocket');
  });
});
