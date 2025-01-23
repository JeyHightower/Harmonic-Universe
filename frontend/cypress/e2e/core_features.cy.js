describe('Core Features E2E Test', () => {
  beforeEach(() => {
    // Reset database state
    cy.exec('npm run reset-test-db');
  });

  it('should complete full user journey', () => {
    // Register
    cy.visit('/register');
    cy.get('[data-testid=username-input]').type('testuser');
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=register-button]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');

    // Create Universe
    cy.get('[data-testid=create-universe-button]').click();
    cy.get('[data-testid=universe-name-input]').type('Test Universe');
    cy.get('[data-testid=universe-description-input]').type('A test universe');
    cy.get('[data-testid=save-universe-button]').click();

    // Should show success message
    cy.get('[data-testid=success-alert]').should('be.visible');

    // View Universe Details
    cy.get('[data-testid=universe-card]').first().click();
    cy.url().should('include', '/universes/');
    cy.get('[data-testid=universe-title]').should('contain', 'Test Universe');

    // Update Parameters
    cy.get('[data-testid=parameters-tab]').click();
    cy.get('[data-testid=gravity-input]').clear().type('10.0');
    cy.get('[data-testid=save-parameters-button]').click();
    cy.get('[data-testid=success-alert]').should('be.visible');

    // Update Privacy Settings
    cy.get('[data-testid=privacy-settings-button]').click();
    cy.get('[data-testid=private-toggle]').click();
    cy.get('[data-testid=save-privacy-button]').click();
    cy.get('[data-testid=success-alert]').should('be.visible');

    // Add to Favorites
    cy.get('[data-testid=favorite-button]').click();
    cy.get('[data-testid=favorite-button]').should('have.class', 'favorited');

    // Update Profile
    cy.visit('/profile');
    cy.get('[data-testid=bio-input]').type('This is my test bio');
    cy.get('[data-testid=save-profile-button]').click();
    cy.get('[data-testid=success-alert]').should('be.visible');

    // Share Universe
    cy.visit('/universes');
    cy.get('[data-testid=universe-card]').first().click();
    cy.get('[data-testid=share-button]').click();
    cy.get('[data-testid=share-email-input]').type('collaborator@example.com');
    cy.get('[data-testid=send-invite-button]').click();
    cy.get('[data-testid=success-alert]').should('be.visible');

    // Logout
    cy.get('[data-testid=logout-button]').click();
    cy.url().should('include', '/login');

    // Login as new user
    cy.visit('/register');
    cy.get('[data-testid=username-input]').type('collaborator');
    cy.get('[data-testid=email-input]').type('collaborator@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=register-button]').click();

    // Accept Universe Invitation
    cy.get('[data-testid=notifications-button]').click();
    cy.get('[data-testid=accept-invite-button]').first().click();
    cy.get('[data-testid=success-alert]').should('be.visible');

    // View Shared Universe
    cy.visit('/universes');
    cy.get('[data-testid=universe-card]').should('have.length', 1);
    cy.get('[data-testid=universe-card]').first().click();

    // Verify Collaborator Access
    cy.get('[data-testid=parameters-tab]').click();
    cy.get('[data-testid=gravity-input]').should('have.value', '10.0');
  });

  it('should handle error cases', () => {
    // Try to access protected route without auth
    cy.visit('/dashboard');
    cy.url().should('include', '/login');

    // Try invalid login
    cy.get('[data-testid=email-input]').type('invalid@example.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();
    cy.get('[data-testid=error-alert]').should('be.visible');

    // Try to create universe without required fields
    cy.visit('/register');
    cy.get('[data-testid=username-input]').type('testuser');
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=register-button]').click();

    cy.get('[data-testid=create-universe-button]').click();
    cy.get('[data-testid=save-universe-button]').click();
    cy.get('[data-testid=form-error]').should('be.visible');

    // Try to access non-existent universe
    cy.visit('/universes/999');
    cy.get('[data-testid=not-found]').should('be.visible');
  });

  it('should handle real-time updates', () => {
    // Setup two users
    cy.visit('/register');
    cy.get('[data-testid=username-input]').type('user1');
    cy.get('[data-testid=email-input]').type('user1@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=register-button]').click();

    // Create universe
    cy.get('[data-testid=create-universe-button]').click();
    cy.get('[data-testid=universe-name-input]').type('Collaborative Universe');
    cy.get('[data-testid=universe-description-input]').type(
      'For testing real-time updates'
    );
    cy.get('[data-testid=save-universe-button]').click();

    // Share with second user
    cy.get('[data-testid=share-button]').click();
    cy.get('[data-testid=share-email-input]').type('user2@example.com');
    cy.get('[data-testid=send-invite-button]').click();

    // Login as second user in another window
    cy.window().then(win => {
      const newWindow = win.open('/register');
      cy.wrap(newWindow).as('secondWindow');
    });

    cy.get('@secondWindow').within(() => {
      cy.get('[data-testid=username-input]').type('user2');
      cy.get('[data-testid=email-input]').type('user2@example.com');
      cy.get('[data-testid=password-input]').type('password123');
      cy.get('[data-testid=register-button]').click();

      // Accept invitation
      cy.get('[data-testid=notifications-button]').click();
      cy.get('[data-testid=accept-invite-button]').first().click();
    });

    // Make changes as first user
    cy.get('[data-testid=parameters-tab]').click();
    cy.get('[data-testid=gravity-input]').clear().type('15.0');
    cy.get('[data-testid=save-parameters-button]').click();

    // Verify changes appear for second user
    cy.get('@secondWindow').within(() => {
      cy.get('[data-testid=parameters-tab]').click();
      cy.get('[data-testid=gravity-input]').should('have.value', '15.0');
    });
  });
});
