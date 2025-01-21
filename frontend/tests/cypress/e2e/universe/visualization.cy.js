describe('Universe Visualization', () => {
  beforeEach(() => {
    // Login and setup mock universe data
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
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
      },
    }).as('getUniverse');

    // Login
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    // Navigate to universe visualization
    cy.visit('/universe/1/visualize');
    cy.wait('@getUniverse');
  });

  it('should load visualization canvas', () => {
    cy.get('[data-testid="visualization-canvas"]').should('be.visible');
    cy.get('[data-testid="controls-panel"]').should('be.visible');
  });

  it('should handle play/pause controls', () => {
    cy.get('[data-testid="play-button"]').click();
    cy.get('[data-testid="pause-button"]').should('be.visible');
    cy.get('[data-testid="play-button"]').should('not.exist');

    cy.get('[data-testid="pause-button"]').click();
    cy.get('[data-testid="play-button"]').should('be.visible');
    cy.get('[data-testid="pause-button"]').should('not.exist');
  });

  it('should handle particle system controls', () => {
    cy.get('[data-testid="particle-count-slider"]').as('particleSlider');
    cy.get('@particleSlider').invoke('val', 100).trigger('change');
    cy.get('[data-testid="preview-particle"]').should('have.length', 100);
  });

  it('should handle physics parameter adjustments', () => {
    cy.get('[data-testid="gravity-slider"]').as('gravitySlider');
    cy.get('@gravitySlider').invoke('val', 5).trigger('change');

    cy.get('[data-testid="friction-slider"]').as('frictionSlider');
    cy.get('@frictionSlider').invoke('val', 0.3).trigger('change');

    // Verify changes are reflected in visualization
    cy.get('[data-testid="physics-info"]').should('contain', 'Gravity: 5');
    cy.get('[data-testid="physics-info"]').should('contain', 'Friction: 0.3');
  });

  it('should handle audio parameter adjustments', () => {
    cy.get('[data-testid="harmony-slider"]').as('harmonySlider');
    cy.get('@harmonySlider').invoke('val', 0.6).trigger('change');

    cy.get('[data-testid="rhythm-slider"]').as('rhythmSlider');
    cy.get('@rhythmSlider').invoke('val', 90).trigger('change');

    // Verify changes are reflected in audio visualization
    cy.get('[data-testid="audio-info"]').should('contain', 'Harmony: 0.6');
    cy.get('[data-testid="audio-info"]').should('contain', 'Rhythm: 90');
  });

  it('should handle color scheme changes', () => {
    cy.get('[data-testid="color-scheme-selector"]').click();
    cy.get('[data-testid="color-scheme-option-neon"]').click();
    cy.get('[data-testid="visualization-canvas"]').should(
      'have.class',
      'neon-theme'
    );
  });

  it('should handle visualization presets', () => {
    cy.get('[data-testid="preset-selector"]').click();
    cy.get('[data-testid="preset-option-galaxy"]').click();

    // Verify preset parameters are applied
    cy.get('[data-testid="particle-count-slider"]').should(
      'have.value',
      '1000'
    );
    cy.get('[data-testid="gravity-slider"]').should('have.value', '2');
  });

  it('should handle fullscreen mode', () => {
    cy.get('[data-testid="fullscreen-button"]').click();
    cy.get('[data-testid="visualization-container"]').should(
      'have.class',
      'fullscreen'
    );

    cy.get('[data-testid="exit-fullscreen-button"]').click();
    cy.get('[data-testid="visualization-container"]').should(
      'not.have.class',
      'fullscreen'
    );
  });

  it('should handle audio visualization modes', () => {
    cy.get('[data-testid="audio-viz-selector"]').click();
    cy.get('[data-testid="audio-viz-option-waveform"]').click();
    cy.get('[data-testid="audio-visualizer"]').should(
      'have.class',
      'waveform-mode'
    );

    cy.get('[data-testid="audio-viz-selector"]').click();
    cy.get('[data-testid="audio-viz-option-frequency"]').click();
    cy.get('[data-testid="audio-visualizer"]').should(
      'have.class',
      'frequency-mode'
    );
  });

  it('should handle recording and playback', () => {
    cy.get('[data-testid="record-button"]').click();
    cy.get('[data-testid="recording-indicator"]').should('be.visible');

    cy.wait(5000); // Record for 5 seconds

    cy.get('[data-testid="stop-recording-button"]').click();
    cy.get('[data-testid="playback-controls"]').should('be.visible');

    cy.get('[data-testid="play-recording-button"]').click();
    cy.get('[data-testid="playback-progress"]').should('exist');
  });

  it('should handle error states', () => {
    // Simulate WebGL context loss
    cy.window().then(win => {
      const canvas = win.document.querySelector(
        '[data-testid="visualization-canvas"]'
      );
      const context = canvas.getContext('webgl');
      context.getExtension('WEBGL_lose_context').loseContext();
    });

    cy.contains('WebGL context lost. Attempting to restore...').should(
      'be.visible'
    );
  });
});
