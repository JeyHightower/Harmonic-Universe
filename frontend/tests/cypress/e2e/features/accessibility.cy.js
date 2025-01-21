describe('Accessibility & Keyboard Shortcuts', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock user preferences
    cy.intercept('GET', '/api/users/1/preferences', {
      statusCode: 200,
      body: {
        accessibility: {
          high_contrast: false,
          font_size: 'medium',
          reduce_motion: false,
          screen_reader: false,
          keyboard_shortcuts: true,
        },
        keyboard_shortcuts: {
          'ctrl+s': 'save',
          'ctrl+z': 'undo',
          'ctrl+y': 'redo',
          'ctrl+/': 'toggle_help',
          esc: 'close_modal',
          space: 'play_pause',
          'alt+1': 'physics_panel',
          'alt+2': 'audio_panel',
          'alt+3': 'visualization_panel',
        },
      },
    }).as('getPreferences');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
      },
    }).as('getUniverse');

    // Login and navigate
    cy.login();
    cy.visit('/universes/1/edit');
    cy.wait(['@getUniverse', '@getPreferences']);
  });

  describe('Keyboard Shortcuts', () => {
    it('should display keyboard shortcuts help', () => {
      // Open shortcuts help
      cy.get('body').type('{ctrl}/');

      cy.get('[data-testid="shortcuts-help"]').within(() => {
        cy.get('[data-testid="shortcut-save"]')
          .should('contain', 'Ctrl + S')
          .and('contain', 'Save');
        cy.get('[data-testid="shortcut-undo"]')
          .should('contain', 'Ctrl + Z')
          .and('contain', 'Undo');
        cy.get('[data-testid="shortcut-redo"]')
          .should('contain', 'Ctrl + Y')
          .and('contain', 'Redo');
      });

      // Close with Escape
      cy.get('body').type('{esc}');
      cy.get('[data-testid="shortcuts-help"]').should('not.exist');
    });

    it('should handle save shortcut', () => {
      cy.intercept('PUT', '/api/universes/1', {
        statusCode: 200,
        body: {
          message: 'Universe saved',
        },
      }).as('saveUniverse');

      // Make a change
      cy.get('[data-testid="universe-name"]').clear().type('Updated Universe');

      // Save with shortcut
      cy.get('body').type('{ctrl}s');
      cy.wait('@saveUniverse');

      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Universe saved'
      );
    });

    it('should handle undo/redo shortcuts', () => {
      // Make changes
      cy.get('[data-testid="universe-name"]').clear().type('First Change');
      cy.get('[data-testid="universe-description"]')
        .clear()
        .type('Second Change');

      // Undo changes
      cy.get('body').type('{ctrl}z');
      cy.get('[data-testid="universe-description"]').should('be.empty');

      cy.get('body').type('{ctrl}z');
      cy.get('[data-testid="universe-name"]').should(
        'have.value',
        'Test Universe'
      );

      // Redo changes
      cy.get('body').type('{ctrl}y');
      cy.get('[data-testid="universe-name"]').should(
        'have.value',
        'First Change'
      );

      cy.get('body').type('{ctrl}y');
      cy.get('[data-testid="universe-description"]').should(
        'have.value',
        'Second Change'
      );
    });

    it('should handle panel navigation shortcuts', () => {
      // Open physics panel
      cy.get('body').type('{alt}1');
      cy.get('[data-testid="physics-panel"]').should('be.visible');

      // Open audio panel
      cy.get('body').type('{alt}2');
      cy.get('[data-testid="audio-panel"]').should('be.visible');

      // Open visualization panel
      cy.get('body').type('{alt}3');
      cy.get('[data-testid="visualization-panel"]').should('be.visible');
    });

    it('should handle playback shortcuts', () => {
      // Play/pause with space
      cy.get('body').type(' ');
      cy.get('[data-testid="play-button"]').should(
        'have.attr',
        'aria-label',
        'Pause'
      );

      cy.get('body').type(' ');
      cy.get('[data-testid="play-button"]').should(
        'have.attr',
        'aria-label',
        'Play'
      );
    });
  });

  describe('Accessibility Features', () => {
    it('should handle high contrast mode', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          accessibility: {
            high_contrast: true,
          },
        },
      }).as('updatePreferences');

      // Enable high contrast
      cy.get('[data-testid="accessibility-settings"]').click();
      cy.get('[data-testid="high-contrast"]').check();
      cy.wait('@updatePreferences');

      // Verify high contrast classes
      cy.get('body').should('have.class', 'high-contrast');
      cy.get('[data-testid="universe-name"]').should(
        'have.class',
        'high-contrast-input'
      );
    });

    it('should handle font size adjustments', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          accessibility: {
            font_size: 'large',
          },
        },
      }).as('updatePreferences');

      // Change font size
      cy.get('[data-testid="accessibility-settings"]').click();
      cy.get('[data-testid="font-size"]').select('large');
      cy.wait('@updatePreferences');

      // Verify font size classes
      cy.get('body').should('have.class', 'font-size-large');
    });

    it('should handle reduced motion', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          accessibility: {
            reduce_motion: true,
          },
        },
      }).as('updatePreferences');

      // Enable reduced motion
      cy.get('[data-testid="accessibility-settings"]').click();
      cy.get('[data-testid="reduce-motion"]').check();
      cy.wait('@updatePreferences');

      // Verify reduced motion classes
      cy.get('body').should('have.class', 'reduce-motion');
    });

    it('should handle screen reader support', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 200,
        body: {
          accessibility: {
            screen_reader: true,
          },
        },
      }).as('updatePreferences');

      // Enable screen reader support
      cy.get('[data-testid="accessibility-settings"]').click();
      cy.get('[data-testid="screen-reader"]').check();
      cy.wait('@updatePreferences');

      // Verify ARIA attributes
      cy.get('[data-testid="universe-name"]')
        .should('have.attr', 'aria-label', 'Universe Name')
        .and('have.attr', 'role', 'textbox');

      cy.get('[data-testid="play-button"]')
        .should('have.attr', 'aria-label', 'Play')
        .and('have.attr', 'role', 'button');
    });
  });

  describe('Focus Management', () => {
    it('should handle keyboard navigation', () => {
      // Tab through elements
      cy.get('body').tab();
      cy.get('[data-testid="universe-name"]').should('have.focus');

      cy.get('body').tab();
      cy.get('[data-testid="universe-description"]').should('have.focus');

      cy.get('body').tab();
      cy.get('[data-testid="play-button"]').should('have.focus');
    });

    it('should handle focus trapping in modals', () => {
      // Open modal
      cy.get('[data-testid="settings-button"]').click();

      // Tab through modal
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'high-contrast');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'font-size');

      // Should stay within modal
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'close-button');

      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'high-contrast');
    });

    it('should restore focus after modal close', () => {
      // Open modal from button
      cy.get('[data-testid="settings-button"]').click();

      // Close modal
      cy.get('body').type('{esc}');

      // Focus should return to trigger
      cy.get('[data-testid="settings-button"]').should('have.focus');
    });
  });

  describe('Semantic HTML', () => {
    it('should use correct heading hierarchy', () => {
      cy.get('h1').should('contain', 'Universe Editor');
      cy.get('h2').should('contain', 'Physics Settings');
      cy.get('h3').should('contain', 'Particle System');
    });

    it('should use semantic landmarks', () => {
      cy.get('nav').should('exist');
      cy.get('main').should('exist');
      cy.get('aside').should('exist');
      cy.get('footer').should('exist');
    });

    it('should use semantic buttons', () => {
      cy.get('button').should('have.attr', 'type');
      cy.get('button[type="submit"]').should('exist');
      cy.get('button[type="button"]').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle preference update errors', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 500,
        body: {
          error: 'Failed to update preferences',
        },
      }).as('preferencesError');

      cy.get('[data-testid="accessibility-settings"]').click();
      cy.get('[data-testid="high-contrast"]').check();
      cy.wait('@preferencesError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to update preferences');
    });

    it('should handle keyboard shortcut conflicts', () => {
      cy.intercept('PUT', '/api/users/1/preferences', {
        statusCode: 400,
        body: {
          error: 'Shortcut already in use',
        },
      }).as('shortcutError');

      cy.get('[data-testid="accessibility-settings"]').click();
      cy.get('[data-testid="customize-shortcuts"]').click();
      cy.get('[data-testid="shortcut-save"]').type('{ctrl}z');
      cy.wait('@shortcutError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Shortcut already in use');
    });
  });
});
