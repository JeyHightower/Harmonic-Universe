describe('Universe CRUD Operations', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('testuser@example.com', 'password123');
  });

  describe('Create Universe', () => {
    it('should create a new universe', () => {
      cy.visit('/universes/new');

      // Fill the form
      cy.get('[data-testid="universe-name-input"]').type('Test Universe');
      cy.get('[data-testid="universe-description-input"]').type(
        'A test universe description'
      );

      // Submit form
      cy.get('[data-testid="create-universe-button"]').click();

      // Verify success
      cy.url().should('include', '/universes');
      cy.contains('Universe created successfully').should('be.visible');
      cy.contains('Test Universe').should('be.visible');
    });

    it('should show validation errors', () => {
      cy.visit('/universes/new');

      // Submit empty form
      cy.get('[data-testid="create-universe-button"]').click();

      // Verify validation errors
      cy.contains('Name is required').should('be.visible');
    });
  });

  describe('Read Universe', () => {
    it('should display universe list', () => {
      cy.visit('/universes');

      // Verify list is loaded
      cy.get('[data-testid="universe-card"]').should('have.length.at.least', 1);
      cy.contains('Test Universe').should('be.visible');
    });

    it('should display universe details', () => {
      // Visit first universe in list
      cy.visit('/universes');
      cy.get('[data-testid="universe-card"]').first().click();

      // Verify details are displayed
      cy.get('[data-testid="universe-details"]').should('be.visible');
      cy.contains('Test Universe').should('be.visible');
      cy.contains('A test universe description').should('be.visible');
    });
  });

  describe('Update Universe', () => {
    it('should update universe details', () => {
      // Visit first universe
      cy.visit('/universes');
      cy.get('[data-testid="universe-card"]').first().click();

      // Click edit button
      cy.get('[data-testid="edit-universe-button"]').click();

      // Update details
      cy.get('[data-testid="universe-name-input"]')
        .clear()
        .type('Updated Universe');
      cy.get('[data-testid="universe-description-input"]')
        .clear()
        .type('Updated description');

      // Save changes
      cy.get('[data-testid="save-universe-button"]').click();

      // Verify updates
      cy.contains('Universe updated successfully').should('be.visible');
      cy.contains('Updated Universe').should('be.visible');
      cy.contains('Updated description').should('be.visible');
    });
  });

  describe('Delete Universe', () => {
    it('should delete universe', () => {
      // Visit first universe
      cy.visit('/universes');
      cy.get('[data-testid="universe-card"]').first().click();

      // Click delete button
      cy.get('[data-testid="delete-universe-button"]').click();

      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Verify deletion
      cy.contains('Universe deleted successfully').should('be.visible');
      cy.contains('Test Universe').should('not.exist');
    });

    it('should cancel deletion', () => {
      cy.visit('/universes');
      cy.get('[data-testid="universe-card"]').first().click();

      // Click delete button
      cy.get('[data-testid="delete-universe-button"]').click();

      // Cancel deletion
      cy.get('[data-testid="cancel-delete-button"]').click();

      // Verify universe still exists
      cy.contains('Test Universe').should('be.visible');
    });
  });

  describe('Universe List Features', () => {
    it('should filter universes', () => {
      cy.visit('/universes');

      // Type in search box
      cy.get('[data-testid="universe-search"]').type('Test');

      // Verify filtered results
      cy.get('[data-testid="universe-card"]').should('have.length.at.least', 1);
      cy.contains('Test Universe').should('be.visible');
    });

    it('should sort universes', () => {
      cy.visit('/universes');

      // Click sort dropdown
      cy.get('[data-testid="sort-dropdown"]').click();
      cy.contains('Name (A-Z)').click();

      // Verify sorting
      cy.get('[data-testid="universe-card"]')
        .first()
        .should('contain', 'Test Universe');
    });
  });
});
