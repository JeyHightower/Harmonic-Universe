describe('UI/UX Features', () => {
  beforeEach(() => {
    // Login
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
        theme: 'light',
        fontSize: 'medium',
        animations: true,
        reducedMotion: false,
        highContrast: false,
        language: 'en',
        shortcuts: true,
      },
    }).as('getPreferences');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/settings/appearance');
    cy.wait('@getPreferences');
  });

  it('should handle responsive design', () => {
    // Test mobile view
    cy.viewport('iphone-x');
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
    cy.get('[data-testid="sidebar"]').should('not.be.visible');

    // Test tablet view
    cy.viewport('ipad-2');
    cy.get('[data-testid="tablet-layout"]').should('be.visible');

    // Test desktop view
    cy.viewport(1920, 1080);
    cy.get('[data-testid="desktop-layout"]').should('be.visible');
    cy.get('[data-testid="sidebar"]').should('be.visible');

    // Test responsive content
    cy.get('[data-testid="responsive-grid"]')
      .should('have.css', 'grid-template-columns')
      .and('match', /repeat\(auto-fit/);
  });

  it('should handle theme switching', () => {
    cy.intercept('PUT', '/api/users/1/preferences', {
      statusCode: 200,
    }).as('updatePreferences');

    // Toggle dark theme
    cy.get('[data-testid="theme-toggle"]').click();
    cy.get('html').should('have.class', 'dark-theme');
    cy.get('[data-testid="theme-status"]').should('contain', 'Dark Theme');

    // Verify theme persistence
    cy.reload();
    cy.get('html').should('have.class', 'dark-theme');

    // Test system theme sync
    cy.get('[data-testid="theme-sync"]').click();
    cy.get('[data-testid="theme-status"]').should('contain', 'System Theme');
  });

  it('should handle accessibility features', () => {
    // Test high contrast mode
    cy.get('[data-testid="high-contrast-toggle"]').click();
    cy.get('html').should('have.class', 'high-contrast');

    // Test font size adjustment
    cy.get('[data-testid="font-size-selector"]').select('large');
    cy.get('html').should('have.class', 'text-lg');

    // Test reduced motion
    cy.get('[data-testid="reduced-motion-toggle"]').click();
    cy.get('html').should('have.class', 'reduce-motion');

    // Test screen reader support
    cy.get('[data-testid="screen-reader-text"]')
      .should('have.class', 'sr-only')
      .and('contain', 'Screen reader content');
  });

  it('should handle custom animations', () => {
    // Test page transitions
    cy.get('[data-testid="animation-demo"]').click();
    cy.get('[data-testid="page-transition"]')
      .should('have.class', 'animate-in')
      .and('have.css', 'animation-duration', '300ms');

    // Test hover effects
    cy.get('[data-testid="hover-element"]')
      .trigger('mouseenter')
      .should('have.class', 'hover-active');

    // Test loading animations
    cy.get('[data-testid="loading-spinner"]')
      .should('be.visible')
      .and('have.css', 'animation-name', 'spin');
  });

  it('should handle interactive tutorials', () => {
    // Start tutorial
    cy.get('[data-testid="start-tutorial"]').click();

    // Verify tutorial steps
    cy.get('[data-testid="tutorial-overlay"]').should('be.visible');
    cy.get('[data-testid="tutorial-step-1"]')
      .should('be.visible')
      .and('contain', 'Welcome to the tutorial');

    // Navigate through steps
    cy.get('[data-testid="tutorial-next"]').click();
    cy.get('[data-testid="tutorial-step-2"]').should('be.visible');

    // Test tutorial interactions
    cy.get('[data-testid="tutorial-interactive"]').click();
    cy.get('[data-testid="tutorial-success"]').should('be.visible');

    // Complete tutorial
    cy.get('[data-testid="tutorial-complete"]').click();
    cy.get('[data-testid="tutorial-finished"]').should('be.visible');
  });

  it('should handle keyboard shortcuts', () => {
    // Open shortcuts panel
    cy.get('body').type('{cmd}k');
    cy.get('[data-testid="shortcuts-panel"]').should('be.visible');

    // Test navigation shortcuts
    cy.get('body').type('{cmd}h');
    cy.url().should('include', '/home');

    // Test action shortcuts
    cy.get('body').type('{cmd}s');
    cy.get('[data-testid="save-indicator"]').should('be.visible');

    // Test shortcut customization
    cy.get('[data-testid="customize-shortcuts"]').click();
    cy.get('[data-testid="shortcut-editor"]').should('be.visible');
    cy.get('[data-testid="new-shortcut"]').type('{cmd}p');
    cy.get('[data-testid="save-shortcuts"]').click();
  });

  it('should handle touch gestures', () => {
    // Enable touch simulation
    cy.get('[data-testid="touch-surface"]').as('surface');

    // Test swipe gesture
    cy.get('@surface')
      .trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 0 }] })
      .trigger('touchend');

    cy.get('[data-testid="swipe-action"]').should('be.visible');

    // Test pinch zoom
    cy.get('@surface')
      .trigger('touchstart', {
        touches: [
          { clientX: 0, clientY: 0 },
          { clientX: 100, clientY: 0 },
        ],
      })
      .trigger('touchmove', {
        touches: [
          { clientX: -50, clientY: 0 },
          { clientX: 150, clientY: 0 },
        ],
      })
      .trigger('touchend');

    cy.get('[data-testid="zoom-level"]').should('contain', '150%');
  });

  it('should handle UI customization', () => {
    // Open customization panel
    cy.get('[data-testid="customize-ui"]').click();

    // Test layout customization
    cy.get('[data-testid="layout-grid"]').click();
    cy.get('[data-testid="content-area"]').should(
      'have.css',
      'display',
      'grid'
    );

    // Test color customization
    cy.get('[data-testid="color-picker"]').click();
    cy.get('[data-testid="primary-color"]')
      .invoke('val', '#FF5733')
      .trigger('change');
    cy.get('[data-testid="theme-preview"]').should(
      'have.css',
      'background-color',
      'rgb(255, 87, 51)'
    );

    // Save customization
    cy.get('[data-testid="save-customization"]').click();
    cy.get('[data-testid="customization-saved"]').should('be.visible');
  });

  it('should handle localization', () => {
    // Change language
    cy.get('[data-testid="language-selector"]').select('es');
    cy.get('[data-testid="welcome-message"]').should('contain', 'Bienvenido');

    // Test date formatting
    cy.get('[data-testid="date-display"]').should(
      'contain',
      '15 de enero de 2024'
    );

    // Test number formatting
    cy.get('[data-testid="number-display"]').should('contain', '1.234,56');

    // Test RTL support
    cy.get('[data-testid="language-selector"]').select('ar');
    cy.get('html').should('have.attr', 'dir', 'rtl');
  });

  it('should handle UI templates', () => {
    // Load template
    cy.get('[data-testid="template-gallery"]').click();
    cy.get('[data-testid="template-scientific"]').click();

    // Verify template application
    cy.get('[data-testid="layout-structure"]').should(
      'have.attr',
      'data-template',
      'scientific'
    );

    // Customize template
    cy.get('[data-testid="template-customize"]').click();
    cy.get('[data-testid="widget-add"]').click();
    cy.get('[data-testid="widget-graph"]').drag(
      '[data-testid="layout-zone-1"]'
    );

    // Save custom template
    cy.get('[data-testid="save-template"]').click();
    cy.get('input[name="template-name"]').type('My Scientific Layout');
    cy.get('[data-testid="confirm-save-template"]').click();

    cy.contains('Template saved successfully').should('be.visible');
  });

  it('should handle error states gracefully', () => {
    // Test form validation
    cy.get('[data-testid="settings-form"]').within(() => {
      cy.get('input[name="email"]').clear();
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Email is required');
    });

    // Test loading states
    cy.intercept('/api/slow-endpoint', req => {
      req.reply({ delay: 1000, body: {} });
    }).as('slowRequest');

    cy.get('[data-testid="load-data"]').click();
    cy.get('[data-testid="loading-state"]').should('be.visible');
    cy.wait('@slowRequest');
    cy.get('[data-testid="loading-state"]').should('not.exist');

    // Test error boundaries
    cy.get('[data-testid="trigger-error"]').click();
    cy.get('[data-testid="error-boundary"]')
      .should('be.visible')
      .and('contain', 'Something went wrong');
  });
});
