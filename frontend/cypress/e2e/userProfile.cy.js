describe('User Profile Operations', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('testuser@example.com', 'password123');
  });

  describe('Create User Profile', () => {
    it('should create new user profile', () => {
      cy.visit('/profile/new');

      // Fill profile form
      cy.get('[data-testid="display-name-input"]').type('Test User');
      cy.get('[data-testid="bio-input"]').type('A test user bio');
      cy.get('[data-testid="avatar-upload"]').attachFile('test-avatar.jpg');

      // Save profile
      cy.get('[data-testid="save-profile-button"]').click();

      // Verify success
      cy.contains('Profile created successfully').should('be.visible');
      cy.url().should('include', '/profile');
    });

    it('should validate required fields', () => {
      cy.visit('/profile/new');

      // Submit empty form
      cy.get('[data-testid="save-profile-button"]').click();

      // Verify validation errors
      cy.contains('Display name is required').should('be.visible');
    });
  });

  describe('Read User Profile', () => {
    it('should display user profile', () => {
      cy.visit('/profile');

      // Verify profile information
      cy.get('[data-testid="profile-display-name"]').should(
        'contain',
        'Test User'
      );
      cy.get('[data-testid="profile-bio"]').should(
        'contain',
        'A test user bio'
      );
      cy.get('[data-testid="profile-avatar"]').should('be.visible');
    });

    it('should show loading state', () => {
      cy.visit('/profile');
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
    });
  });

  describe('Update User Profile', () => {
    it('should update profile details', () => {
      cy.visit('/profile/edit');

      // Update profile information
      cy.get('[data-testid="display-name-input"]').clear().type('Updated User');
      cy.get('[data-testid="bio-input"]').clear().type('Updated bio');
      cy.get('[data-testid="avatar-upload"]').attachFile('new-avatar.jpg');

      // Save changes
      cy.get('[data-testid="save-profile-button"]').click();

      // Verify updates
      cy.contains('Profile updated successfully').should('be.visible');
      cy.get('[data-testid="profile-display-name"]').should(
        'contain',
        'Updated User'
      );
      cy.get('[data-testid="profile-bio"]').should('contain', 'Updated bio');
    });

    it('should handle update errors', () => {
      cy.visit('/profile/edit');

      // Try to update with invalid data
      cy.get('[data-testid="display-name-input"]').clear().type('a'); // Too short
      cy.get('[data-testid="save-profile-button"]').click();

      // Verify error message
      cy.contains('Display name must be at least 2 characters').should(
        'be.visible'
      );
    });
  });

  describe('Delete User Profile', () => {
    it('should delete profile', () => {
      cy.visit('/profile');

      // Click delete button
      cy.get('[data-testid="delete-profile-button"]').click();

      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Verify deletion
      cy.contains('Profile deleted successfully').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('should cancel profile deletion', () => {
      cy.visit('/profile');

      // Click delete button
      cy.get('[data-testid="delete-profile-button"]').click();

      // Cancel deletion
      cy.get('[data-testid="cancel-delete-button"]').click();

      // Verify profile still exists
      cy.get('[data-testid="profile-display-name"]').should('be.visible');
    });
  });

  describe('Profile Privacy Settings', () => {
    it('should update privacy settings', () => {
      cy.visit('/profile/settings');

      // Update privacy settings
      cy.get('[data-testid="profile-visibility"]').select('friends');
      cy.get('[data-testid="activity-visibility"]').select('private');

      // Save settings
      cy.get('[data-testid="save-settings-button"]').click();

      // Verify updates
      cy.contains('Settings updated successfully').should('be.visible');
      cy.get('[data-testid="profile-visibility"]').should(
        'have.value',
        'friends'
      );
      cy.get('[data-testid="activity-visibility"]').should(
        'have.value',
        'private'
      );
    });
  });
});
