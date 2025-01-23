describe('Accessibility Context', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');
  });

  describe('Focus Management', () => {
    it('should manage focus history', () => {
      // Navigate to universe list
      cy.visit('/universes');

      // Open settings modal
      cy.get('[data-testid="settings-button"]').click();
      cy.get('[data-testid="settings-modal"]').should('be.visible');

      // Focus should be on first focusable element
      cy.focused().should('have.attr', 'data-testid', 'settings-title');

      // Close modal
      cy.get('[data-testid="close-modal"]').click();

      // Focus should return to trigger button
      cy.get('[data-testid="settings-button"]').should('have.focus');
    });

    it('should handle complex focus scenarios', () => {
      cy.visit('/universes/create');

      // Open color picker
      cy.get('[data-testid="color-picker-button"]').click();
      cy.get('[data-testid="color-picker"]').should('be.visible');

      // Open preset colors
      cy.get('[data-testid="preset-colors-button"]').click();
      cy.get('[data-testid="preset-colors"]').should('be.visible');

      // Close preset colors
      cy.get('[data-testid="close-presets"]').click();

      // Focus should return to color picker
      cy.get('[data-testid="color-picker"]').should('be.visible');
      cy.focused().should('have.attr', 'data-testid', 'color-picker-input');

      // Close color picker
      cy.get('[data-testid="close-color-picker"]').click();

      // Focus should return to trigger
      cy.get('[data-testid="color-picker-button"]').should('have.focus');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', () => {
      cy.visit('/universes');

      // Focus first card
      cy.get('[data-testid="universe-card"]').first().focus();

      // Navigate with arrow keys
      cy.focused().type('{rightarrow}');
      cy.focused().should('have.attr', 'data-testid', 'universe-card-1');

      cy.focused().type('{downarrow}');
      cy.focused().should('have.attr', 'data-testid', 'universe-card-4');

      cy.focused().type('{leftarrow}');
      cy.focused().should('have.attr', 'data-testid', 'universe-card-3');

      cy.focused().type('{uparrow}');
      cy.focused().should('have.attr', 'data-testid', 'universe-card-0');
    });

    it('should handle home/end navigation', () => {
      cy.visit('/universes');

      // Focus first card
      cy.get('[data-testid="universe-card"]').first().focus();

      // Navigate to end
      cy.focused().type('{end}');
      cy.focused().should('have.attr', 'data-testid', 'universe-card-last');

      // Navigate to home
      cy.focused().type('{home}');
      cy.focused().should('have.attr', 'data-testid', 'universe-card-0');
    });

    it('should handle tab navigation in modals', () => {
      cy.visit('/universes/create');

      // Open settings modal
      cy.get('[data-testid="settings-button"]').click();

      // Tab through all focusable elements
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'setting-1');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'setting-2');

      // Tab should stay within modal
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'close-modal');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'setting-1');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce status changes', () => {
      cy.visit('/universes/create');

      // Fill form
      cy.get('[data-testid="universe-name"]').type('Test Universe');
      cy.get('[data-testid="universe-description"]').type('Test Description');

      // Submit form
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify polite announcement
      cy.get('[aria-live="polite"]').should('contain', 'Creating universe...');

      // Mock success response
      cy.intercept('POST', '/api/universes', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test Universe',
        },
      }).as('createUniverse');

      cy.wait('@createUniverse');

      // Verify success announcement
      cy.get('[aria-live="polite"]').should(
        'contain',
        'Universe created successfully'
      );
    });

    it('should announce errors assertively', () => {
      cy.visit('/universes/create');

      // Submit empty form
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify assertive error announcement
      cy.get('[aria-live="assertive"]').should(
        'contain',
        'Please fill in all required fields'
      );

      // Fill form incorrectly
      cy.get('[data-testid="universe-name"]').type('a');
      cy.get('[data-testid="create-universe-submit"]').click();

      // Verify validation error announcement
      cy.get('[aria-live="assertive"]').should(
        'contain',
        'Universe name must be at least 3 characters'
      );
    });

    it('should handle multiple announcements', () => {
      cy.visit('/universes');

      // Trigger multiple status changes
      cy.get('[data-testid="filter-button"]').click();
      cy.get('[data-testid="sort-button"]').click();
      cy.get('[data-testid="view-button"]').click();

      // Verify announcements are queued and cleared
      cy.get('[aria-live="polite"]').should('not.be.empty');

      // Wait for announcements to clear
      cy.wait(3000);
      cy.get('[aria-live="polite"]').should('be.empty');
    });
  });

  describe('Focus Trapping', () => {
    it('should trap focus in nested modals', () => {
      cy.visit('/universes/create');

      // Open settings
      cy.get('[data-testid="settings-button"]').click();

      // Open nested dialog
      cy.get('[data-testid="advanced-settings"]').click();

      // Focus should be trapped in nested dialog
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'nested-setting-1');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'nested-setting-2');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'close-nested');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'nested-setting-1');

      // Close nested dialog
      cy.get('[data-testid="close-nested"]').click();

      // Focus should be trapped in parent modal
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'setting-1');
    });

    it('should handle dynamic content in trapped regions', () => {
      cy.visit('/universes/create');

      // Open dialog with dynamic content
      cy.get('[data-testid="dynamic-dialog"]').click();

      // Initial focus trap
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'item-1');

      // Add new item
      cy.get('[data-testid="add-item"]').click();

      // Focus trap should include new item
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'item-2');

      // Remove item
      cy.get('[data-testid="remove-item-1"]').click();

      // Focus trap should adjust
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'add-item');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle global shortcuts', () => {
      cy.visit('/universes');

      // Open help dialog
      cy.get('body').type('{ctrl+/}');
      cy.get('[data-testid="help-dialog"]').should('be.visible');

      // Close dialog with escape
      cy.get('body').type('{esc}');
      cy.get('[data-testid="help-dialog"]').should('not.exist');

      // Toggle theme
      cy.get('body').type('{ctrl+t}');
      cy.get('html').should('have.class', 'dark-theme');
    });

    it('should handle context-specific shortcuts', () => {
      cy.visit('/universes/1/edit');

      // Save with keyboard
      cy.get('body').type('{ctrl+s}');
      cy.get('[data-testid="save-indicator"]')
        .should('be.visible')
        .and('contain', 'Saved');

      // Undo/Redo
      cy.get('[data-testid="universe-name"]').type('New Name');
      cy.get('body').type('{ctrl+z}');
      cy.get('[data-testid="universe-name"]').should('have.value', '');

      cy.get('body').type('{ctrl+y}');
      cy.get('[data-testid="universe-name"]').should('have.value', 'New Name');
    });

    it('should handle shortcut conflicts', () => {
      cy.visit('/universes/1/edit');

      // Open multiple panels
      cy.get('body').type('{alt+1}');
      cy.get('[data-testid="physics-panel"]').should('be.visible');

      cy.get('body').type('{alt+2}');
      cy.get('[data-testid="audio-panel"]').should('be.visible');

      // Last opened panel should have focus
      cy.focused().should('have.attr', 'data-testid', 'audio-panel');

      // Close panels with escape
      cy.get('body').type('{esc}');
      cy.get('[data-testid="audio-panel"]').should('not.exist');

      cy.get('body').type('{esc}');
      cy.get('[data-testid="physics-panel"]').should('not.exist');
    });
  });
});
