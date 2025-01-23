describe('Physics Engine', () => {
  beforeEach(() => {
    // Login
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
        name: 'Physics Test Universe',
        physics_params: {
          gravity: 9.81,
          friction: 0.5,
          elasticity: 0.7,
          airResistance: 0.1,
          temperature: 293,
        },
      },
    }).as('getUniverse');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universe/1/physics');
    cy.wait('@getUniverse');
  });

  it('should handle particle system', () => {
    cy.get('[data-testid="particle-system"]').should('be.visible');

    // Add particles
    cy.get('[data-testid="add-particle"]').click();
    cy.get('input[name="mass"]').type('1.0');
    cy.get('input[name="velocity-x"]').type('5.0');
    cy.get('input[name="velocity-y"]').type('0.0');
    cy.get('[data-testid="confirm-add-particle"]').click();

    cy.get('[data-testid="particle-count"]').should('contain', '1');

    // Verify particle motion
    cy.get('[data-testid="particle-0"]')
      .should('have.attr', 'data-velocity-x', '5.0')
      .should('have.attr', 'data-velocity-y', '0.0');
  });

  it('should handle force fields', () => {
    cy.get('[data-testid="force-fields"]').should('be.visible');

    // Add gravitational field
    cy.get('[data-testid="add-force-field"]').click();
    cy.get('[data-testid="field-type"]').select('gravitational');
    cy.get('input[name="field-strength"]').type('9.81');
    cy.get('input[name="field-direction"]').type('270');
    cy.get('[data-testid="confirm-add-field"]').click();

    cy.get('[data-testid="force-field-0"]').should('be.visible');
    cy.get('[data-testid="field-indicator"]').should(
      'have.attr',
      'data-direction',
      '270'
    );
  });

  it('should handle collision detection', () => {
    // Add colliding objects
    cy.get('[data-testid="add-object"]').click();
    cy.get('input[name="object-type"]').select('circle');
    cy.get('input[name="radius"]').type('10');
    cy.get('input[name="position-x"]').type('0');
    cy.get('input[name="position-y"]').type('0');
    cy.get('[data-testid="confirm-add-object"]').click();

    cy.get('[data-testid="add-object"]').click();
    cy.get('input[name="object-type"]').select('circle');
    cy.get('input[name="radius"]').type('10');
    cy.get('input[name="position-x"]').type('15');
    cy.get('input[name="position-y"]').type('0');
    cy.get('[data-testid="confirm-add-object"]').click();

    // Start simulation
    cy.get('[data-testid="start-simulation"]').click();

    // Verify collision detection
    cy.get('[data-testid="collision-event"]').should('be.visible');
    cy.get('[data-testid="collision-count"]').should('contain', '1');
  });

  it('should handle physical properties', () => {
    cy.get('[data-testid="properties-panel"]').should('be.visible');

    // Modify object properties
    cy.get('[data-testid="add-object"]').click();
    cy.get('input[name="object-type"]').select('rectangle');
    cy.get('input[name="width"]').type('20');
    cy.get('input[name="height"]').type('10');
    cy.get('[data-testid="confirm-add-object"]').click();

    cy.get('[data-testid="object-0"]').click();
    cy.get('input[name="density"]').clear().type('2.0');
    cy.get('input[name="restitution"]').clear().type('0.8');
    cy.get('input[name="friction"]').clear().type('0.3');
    cy.get('[data-testid="apply-properties"]').click();

    cy.get('[data-testid="object-0"]')
      .should('have.attr', 'data-density', '2.0')
      .should('have.attr', 'data-restitution', '0.8')
      .should('have.attr', 'data-friction', '0.3');
  });

  it('should handle real-time calculations', () => {
    // Setup test object
    cy.get('[data-testid="add-object"]').click();
    cy.get('input[name="object-type"]').select('circle');
    cy.get('input[name="radius"]').type('10');
    cy.get('input[name="position-y"]').type('100');
    cy.get('[data-testid="confirm-add-object"]').click();

    // Start simulation
    cy.get('[data-testid="start-simulation"]').click();

    // Verify physics calculations
    cy.get('[data-testid="object-0"]').should($obj => {
      const y = parseFloat($obj.attr('data-position-y'));
      expect(y).to.be.lessThan(100); // Object should fall due to gravity
    });

    cy.get('[data-testid="physics-stats"]').within(() => {
      cy.get('[data-testid="calculation-time"]').should('exist');
      cy.get('[data-testid="frame-rate"]').should('exist');
    });
  });

  it('should handle physics-based animations', () => {
    // Create animated object
    cy.get('[data-testid="add-animated-object"]').click();
    cy.get('input[name="animation-type"]').select('pendulum');
    cy.get('input[name="length"]').type('100');
    cy.get('input[name="angle"]').type('45');
    cy.get('[data-testid="confirm-animation"]').click();

    // Start animation
    cy.get('[data-testid="start-animation"]').click();

    // Verify animation properties
    cy.get('[data-testid="animated-object-0"]').should(
      'have.attr',
      'data-animating',
      'true'
    );
    cy.get('[data-testid="animation-controls"]').should('be.visible');
  });

  it('should handle custom physics rules', () => {
    cy.get('[data-testid="custom-rules"]').should('be.visible');

    // Add custom force rule
    cy.get('[data-testid="add-custom-rule"]').click();
    cy.get('input[name="rule-name"]').type('wind-force');
    cy.get('textarea[name="rule-formula"]').type('F = 0.5 * v^2 * A');
    cy.get('input[name="rule-direction"]').type('0');
    cy.get('[data-testid="save-rule"]').click();

    // Apply rule to object
    cy.get('[data-testid="add-object"]').click();
    cy.get('input[name="object-type"]').select('rectangle');
    cy.get('[data-testid="confirm-add-object"]').click();

    cy.get('[data-testid="object-0"]').click();
    cy.get('[data-testid="apply-custom-rule"]').click();
    cy.get('[data-testid="rule-wind-force"]').check();
    cy.get('[data-testid="confirm-rules"]').click();

    cy.get('[data-testid="object-0"]').should(
      'have.attr',
      'data-custom-rules',
      'wind-force'
    );
  });

  it('should handle physics presets', () => {
    cy.get('[data-testid="presets-panel"]').should('be.visible');

    // Load preset
    cy.get('[data-testid="load-preset"]').click();
    cy.get('[data-testid="preset-space"]').click();

    // Verify preset values
    cy.get('[data-testid="gravity-value"]').should('contain', '0');
    cy.get('[data-testid="air-resistance-value"]').should('contain', '0');

    // Save custom preset
    cy.get('[data-testid="save-preset"]').click();
    cy.get('input[name="preset-name"]').type('Custom Space');
    cy.get('[data-testid="confirm-save-preset"]').click();

    cy.contains('Preset saved successfully').should('be.visible');
  });

  it('should handle physics debugging', () => {
    cy.get('[data-testid="debug-panel"]').should('be.visible');

    // Enable debug mode
    cy.get('[data-testid="enable-debug"]').click();

    // Verify debug visualizations
    cy.get('[data-testid="collision-boxes"]').should('be.visible');
    cy.get('[data-testid="force-vectors"]').should('be.visible');
    cy.get('[data-testid="velocity-vectors"]').should('be.visible');

    // Check debug info
    cy.get('[data-testid="debug-info"]').within(() => {
      cy.get('[data-testid="collision-tests"]').should('exist');
      cy.get('[data-testid="physics-steps"]').should('exist');
      cy.get('[data-testid="object-count"]').should('exist');
    });
  });

  it('should handle physics optimization', () => {
    // Add multiple objects
    for (let i = 0; i < 100; i++) {
      cy.get('[data-testid="add-particle"]').click();
      cy.get('[data-testid="quick-add"]').click();
    }

    // Enable performance monitoring
    cy.get('[data-testid="performance-monitor"]').click();

    // Verify optimization features
    cy.get('[data-testid="spatial-partitioning"]').should('be.visible');
    cy.get('[data-testid="broad-phase-collision"]').should('be.visible');
    cy.get('[data-testid="performance-stats"]').within(() => {
      cy.get('[data-testid="fps"]').should('exist');
      cy.get('[data-testid="physics-time"]').should('exist');
      cy.get('[data-testid="collision-checks"]').should('exist');
    });

    // Test optimization settings
    cy.get('[data-testid="optimization-settings"]').click();
    cy.get('[data-testid="grid-size"]').clear().type('50');
    cy.get('[data-testid="update-frequency"]').clear().type('30');
    cy.get('[data-testid="apply-optimization"]').click();

    cy.contains('Optimization settings updated').should('be.visible');
  });
});
