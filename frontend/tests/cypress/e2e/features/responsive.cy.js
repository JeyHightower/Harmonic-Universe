describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock universe data
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
        physics_params: {
          particle_count: 1000,
          gravity: 9.81,
          friction: 0.5,
        },
        audio_params: {
          sample_rate: 44100,
          channels: 2,
          bit_depth: 16,
        },
      },
    }).as('getUniverse');

    // Login
    cy.login();
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport('iphone-x');
      cy.visit('/universes/1/edit');
      cy.wait('@getUniverse');
    });

    it('should display mobile navigation', () => {
      // Verify hamburger menu
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');

      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click();

      cy.get('[data-testid="mobile-menu"]').within(() => {
        cy.get('[data-testid="nav-dashboard"]').should('be.visible');
        cy.get('[data-testid="nav-profile"]').should('be.visible');
        cy.get('[data-testid="nav-settings"]').should('be.visible');
      });

      // Close menu with swipe
      cy.get('[data-testid="mobile-menu"]')
        .trigger('touchstart', { touches: [{ clientX: 250, clientY: 200 }] })
        .trigger('touchmove', { touches: [{ clientX: 50, clientY: 200 }] })
        .trigger('touchend');

      cy.get('[data-testid="mobile-menu"]').should('not.be.visible');
    });

    it('should handle responsive controls', () => {
      // Verify controls are stacked
      cy.get('[data-testid="controls-container"]').should(
        'have.css',
        'flex-direction',
        'column'
      );

      // Verify touch-friendly sizing
      cy.get('[data-testid="play-button"]')
        .should('have.css', 'min-height', '44px')
        .and('have.css', 'min-width', '44px');

      cy.get('[data-testid="slider-control"]').should(
        'have.css',
        'height',
        '44px'
      );
    });

    it('should handle responsive panels', () => {
      // Verify panels are full width
      cy.get('[data-testid="physics-panel"]').should(
        'have.css',
        'width',
        '100%'
      );

      // Verify panel switching
      cy.get('[data-testid="panel-tabs"]').within(() => {
        cy.get('[data-testid="physics-tab"]').click();
        cy.get('[data-testid="physics-panel"]').should('be.visible');

        cy.get('[data-testid="audio-tab"]').click();
        cy.get('[data-testid="audio-panel"]').should('be.visible');
      });
    });

    it('should handle touch gestures', () => {
      // Pinch to zoom
      cy.get('[data-testid="visualization-canvas"]')
        .trigger('touchstart', {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ],
        })
        .trigger('touchmove', {
          touches: [
            { clientX: 50, clientY: 50 },
            { clientX: 250, clientY: 250 },
          ],
        })
        .trigger('touchend');

      // Verify zoom level
      cy.get('[data-testid="zoom-level"]').should('contain', '150%');

      // Rotate
      cy.get('[data-testid="visualization-canvas"]')
        .trigger('touchstart', {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 100 },
          ],
        })
        .trigger('touchmove', {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ],
        })
        .trigger('touchend');

      // Verify rotation
      cy.get('[data-testid="rotation-angle"]').should('contain', '45°');
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      // Set tablet viewport
      cy.viewport('ipad-2');
      cy.visit('/universes/1/edit');
      cy.wait('@getUniverse');
    });

    it('should display tablet navigation', () => {
      // Verify sidebar is collapsed by default
      cy.get('[data-testid="sidebar"]')
        .should('have.class', 'collapsed')
        .and('have.css', 'width', '64px');

      // Expand sidebar
      cy.get('[data-testid="expand-sidebar"]').click();

      cy.get('[data-testid="sidebar"]')
        .should('not.have.class', 'collapsed')
        .and('have.css', 'width', '250px');
    });

    it('should handle split view', () => {
      // Verify panels are side by side
      cy.get('[data-testid="editor-layout"]').should(
        'have.css',
        'grid-template-columns',
        '1fr 1fr'
      );

      // Verify resizable panels
      cy.get('[data-testid="resize-handle"]')
        .trigger('mousedown')
        .trigger('mousemove', { clientX: 800 })
        .trigger('mouseup');

      cy.get('[data-testid="left-panel"]')
        .should('have.css', 'width')
        .and('match', /800px/);
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      // Set desktop viewport
      cy.viewport(1920, 1080);
      cy.visit('/universes/1/edit');
      cy.wait('@getUniverse');
    });

    it('should display desktop navigation', () => {
      // Verify full navigation
      cy.get('[data-testid="main-nav"]').within(() => {
        cy.get('[data-testid="nav-dashboard"]').should('be.visible');
        cy.get('[data-testid="nav-profile"]').should('be.visible');
        cy.get('[data-testid="nav-settings"]').should('be.visible');
      });

      // Verify no mobile menu button
      cy.get('[data-testid="mobile-menu-button"]').should('not.exist');
    });

    it('should handle multi-panel layout', () => {
      // Verify three-column layout
      cy.get('[data-testid="editor-layout"]').should(
        'have.css',
        'grid-template-columns',
        '1fr 2fr 1fr'
      );

      // Verify all panels visible
      cy.get('[data-testid="left-panel"]').should('be.visible');
      cy.get('[data-testid="center-panel"]').should('be.visible');
      cy.get('[data-testid="right-panel"]').should('be.visible');
    });
  });

  describe('Responsive Images', () => {
    it('should load appropriate image sizes', () => {
      // Mobile
      cy.viewport('iphone-x');
      cy.get('[data-testid="universe-preview"]')
        .should('have.attr', 'srcset')
        .and('include', 'small.jpg 300w')
        .and('include', 'medium.jpg 600w');

      // Tablet
      cy.viewport('ipad-2');
      cy.get('[data-testid="universe-preview"]')
        .should('have.attr', 'srcset')
        .and('include', 'medium.jpg 600w')
        .and('include', 'large.jpg 1200w');

      // Desktop
      cy.viewport(1920, 1080);
      cy.get('[data-testid="universe-preview"]')
        .should('have.attr', 'srcset')
        .and('include', 'large.jpg 1200w')
        .and('include', 'xlarge.jpg 2400w');
    });

    it('should lazy load images', () => {
      cy.get('[data-testid="universe-preview"]').should(
        'have.attr',
        'loading',
        'lazy'
      );
    });
  });

  describe('Responsive Performance', () => {
    it('should adjust particle count based on device', () => {
      // Mobile - reduced particles
      cy.viewport('iphone-x');
      cy.get('[data-testid="particle-count"]').should('contain', '500');

      // Tablet - medium particles
      cy.viewport('ipad-2');
      cy.get('[data-testid="particle-count"]').should('contain', '1000');

      // Desktop - full particles
      cy.viewport(1920, 1080);
      cy.get('[data-testid="particle-count"]').should('contain', '2000');
    });

    it('should adjust render quality based on device', () => {
      // Mobile - low quality
      cy.viewport('iphone-x');
      cy.get('[data-testid="render-quality"]').should('contain', 'Low');

      // Tablet - medium quality
      cy.viewport('ipad-2');
      cy.get('[data-testid="render-quality"]').should('contain', 'Medium');

      // Desktop - high quality
      cy.viewport(1920, 1080);
      cy.get('[data-testid="render-quality"]').should('contain', 'High');
    });
  });

  describe('Error Handling', () => {
    it('should display responsive error messages', () => {
      cy.intercept('GET', '/api/universes/1', {
        statusCode: 500,
        body: {
          error: 'Failed to load universe',
        },
      }).as('loadError');

      // Mobile
      cy.viewport('iphone-x');
      cy.visit('/universes/1/edit');
      cy.wait('@loadError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('have.css', 'width', '100%');

      // Desktop
      cy.viewport(1920, 1080);
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('have.css', 'width', '500px');
    });

    it('should handle offline state responsively', () => {
      // Simulate offline
      cy.window().then(win => {
        win.dispatchEvent(new Event('offline'));
      });

      // Mobile
      cy.viewport('iphone-x');
      cy.get('[data-testid="offline-banner"]')
        .should('be.visible')
        .and('have.css', 'position', 'fixed')
        .and('have.css', 'bottom', '0px');

      // Desktop
      cy.viewport(1920, 1080);
      cy.get('[data-testid="offline-banner"]')
        .should('be.visible')
        .and('have.css', 'position', 'absolute')
        .and('have.css', 'top', '0px');
    });
  });
});
