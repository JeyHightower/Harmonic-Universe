describe('Universe Creation Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    // Navigate to universe builder
    cy.visit('/universe-builder');
  });

  it('should display universe creation form', () => {
    cy.get('input[name="name"]').should('be.visible');
    cy.get('textarea[name="description"]').should('be.visible');
    cy.get('[data-testid="physics-panel"]').should('be.visible');
    cy.get('[data-testid="audio-panel"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Description is required').should('be.visible');
  });

  it('should handle physics parameters', () => {
    cy.get('[data-testid="physics-panel"]').within(() => {
      cy.get('input[name="gravity"]').clear().type('9.81');
      cy.get('input[name="friction"]').clear().type('0.5');
      cy.get('input[name="elasticity"]').clear().type('0.7');
    });
  });

  it('should handle audio parameters', () => {
    cy.get('[data-testid="audio-panel"]').within(() => {
      cy.get('input[name="harmony"]').clear().type('0.8');
      cy.get('input[name="rhythm"]').clear().type('120');
      cy.get('input[name="timbre"]').clear().type('0.6');
    });
  });

  it('should create universe successfully', () => {
    cy.intercept('POST', '/api/universes', {
      statusCode: 201,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
        physics_params: {
          gravity: 9.81,
          friction: 0.5,
          elasticity: 0.7,
        },
        audio_params: {
          harmony: 0.8,
          rhythm: 120,
          timbre: 0.6,
        },
        owner_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }).as('createUniverse');

    cy.get('input[name="name"]').type('Test Universe');
    cy.get('textarea[name="description"]').type('A test universe');

    cy.get('[data-testid="physics-panel"]').within(() => {
      cy.get('input[name="gravity"]').clear().type('9.81');
      cy.get('input[name="friction"]').clear().type('0.5');
      cy.get('input[name="elasticity"]').clear().type('0.7');
    });

    cy.get('[data-testid="audio-panel"]').within(() => {
      cy.get('input[name="harmony"]').clear().type('0.8');
      cy.get('input[name="rhythm"]').clear().type('120');
      cy.get('input[name="timbre"]').clear().type('0.6');
    });

    cy.get('button[type="submit"]').click();
    cy.wait('@createUniverse');
    cy.url().should('include', '/universe/1');
    cy.contains('Universe created successfully').should('be.visible');
  });

  it('should handle network error', () => {
    cy.intercept('POST', '/api/universes', {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    }).as('createUniverse');

    cy.get('input[name="name"]').type('Test Universe');
    cy.get('textarea[name="description"]').type('A test universe');
    cy.get('button[type="submit"]').click();

    cy.wait('@createUniverse');
    cy.contains('An error occurred. Please try again.').should('be.visible');
  });

  it('should handle template selection', () => {
    cy.get('[data-testid="template-selector"]').click();
    cy.get('[data-testid="template-option-standard"]').click();

    // Verify template values are loaded
    cy.get('input[name="gravity"]').should('have.value', '9.81');
    cy.get('input[name="friction"]').should('have.value', '0.5');
    cy.get('input[name="harmony"]').should('have.value', '0.7');
  });

  it('should preview physics simulation', () => {
    cy.get('[data-testid="preview-button"]').click();
    cy.get('[data-testid="physics-preview"]').should('be.visible');
    cy.get('[data-testid="preview-particle"]').should('have.length.gt', 0);
  });

  it('should preview audio generation', () => {
    cy.get('[data-testid="audio-preview-button"]').click();
    cy.get('[data-testid="audio-visualizer"]').should('be.visible');
    cy.get('[data-testid="play-button"]').should('be.visible');
  });

  it('should handle sharing settings', () => {
    cy.get('[data-testid="sharing-button"]').click();
    cy.get('[data-testid="sharing-modal"]').should('be.visible');
    cy.get('input[name="collaborator-email"]').type('collaborator@example.com');
    cy.get('[data-testid="add-collaborator"]').click();
    cy.contains('Invitation sent to collaborator@example.com').should(
      'be.visible'
    );
  });
});
