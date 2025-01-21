describe('Audio System', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock audio settings
    cy.intercept('GET', '/api/audio/settings', {
      statusCode: 200,
      body: {
        synthesis: {
          oscillator_type: 'sine',
          frequency: 440,
          detune: 0,
          volume: 0.5,
        },
        effects: {
          reverb: {
            enabled: true,
            decay: 2.0,
            wet: 0.3,
          },
          delay: {
            enabled: true,
            time: 0.3,
            feedback: 0.4,
          },
          filter: {
            enabled: false,
            type: 'lowpass',
            frequency: 1000,
            Q: 1,
          },
        },
        visualization: {
          mode: 'waveform',
          sensitivity: 0.8,
          color_scheme: 'spectrum',
        },
      },
    }).as('getAudioSettings');

    // Mock audio presets
    cy.intercept('GET', '/api/audio/presets', {
      statusCode: 200,
      body: {
        presets: [
          {
            id: 1,
            name: 'Ambient',
            description: 'Smooth ambient sounds',
            settings: {
              synthesis: {
                oscillator_type: 'sine',
                frequency: 220,
                detune: 5,
                volume: 0.4,
              },
              effects: {
                reverb: { enabled: true, decay: 4.0, wet: 0.5 },
                delay: { enabled: true, time: 0.5, feedback: 0.6 },
              },
            },
          },
          {
            id: 2,
            name: 'Dynamic',
            description: 'Energetic sounds',
            settings: {
              synthesis: {
                oscillator_type: 'square',
                frequency: 440,
                detune: 0,
                volume: 0.6,
              },
              effects: {
                filter: {
                  enabled: true,
                  type: 'bandpass',
                  frequency: 2000,
                  Q: 2,
                },
              },
            },
          },
        ],
      },
    }).as('getPresets');

    // Mock audio analysis data
    cy.intercept('GET', '/api/audio/analysis', {
      statusCode: 200,
      body: {
        frequency_data: new Array(128).fill(0).map((_, i) => i % 100),
        waveform_data: new Array(128).fill(0).map((_, i) => Math.sin(i / 10)),
        spectrum_data: new Array(128).fill(0).map((_, i) => i % 50),
      },
    }).as('getAnalysis');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/audio');
    cy.wait(['@getAudioSettings', '@getPresets', '@getAnalysis']);
  });

  it('should handle audio synthesis controls', () => {
    // Test oscillator type
    cy.get('[data-testid="oscillator-type"]').select('square');
    cy.get('[data-testid="oscillator-preview"]').should('be.visible');

    // Test frequency control
    cy.get('[data-testid="frequency-slider"]')
      .invoke('val', 880)
      .trigger('change');
    cy.get('[data-testid="frequency-value"]').should('contain', '880 Hz');

    // Test detune control
    cy.get('[data-testid="detune-slider"]').invoke('val', 10).trigger('change');
    cy.get('[data-testid="detune-value"]').should('contain', '10 cents');

    // Test volume control
    cy.get('[data-testid="volume-slider"]')
      .invoke('val', 0.7)
      .trigger('change');
    cy.get('[data-testid="volume-value"]').should('contain', '70%');

    // Test start/stop
    cy.get('[data-testid="start-oscillator"]').click();
    cy.get('[data-testid="oscillator-status"]').should('contain', 'Playing');
    cy.get('[data-testid="stop-oscillator"]').click();
    cy.get('[data-testid="oscillator-status"]').should('contain', 'Stopped');
  });

  it('should handle audio effects', () => {
    cy.get('[data-testid="effects-tab"]').click();

    // Test reverb
    cy.get('[data-testid="reverb-enable"]').check();
    cy.get('[data-testid="reverb-decay"]').invoke('val', 3.0).trigger('change');
    cy.get('[data-testid="reverb-wet"]').invoke('val', 0.4).trigger('change');
    cy.get('[data-testid="reverb-preview"]').click();

    // Test delay
    cy.get('[data-testid="delay-enable"]').check();
    cy.get('[data-testid="delay-time"]').invoke('val', 0.4).trigger('change');
    cy.get('[data-testid="delay-feedback"]')
      .invoke('val', 0.5)
      .trigger('change');
    cy.get('[data-testid="delay-preview"]').click();

    // Test filter
    cy.get('[data-testid="filter-enable"]').check();
    cy.get('[data-testid="filter-type"]').select('highpass');
    cy.get('[data-testid="filter-frequency"]')
      .invoke('val', 2000)
      .trigger('change');
    cy.get('[data-testid="filter-q"]').invoke('val', 2).trigger('change');
    cy.get('[data-testid="filter-preview"]').click();

    // Save effects chain
    cy.get('[data-testid="save-effects"]').click();
    cy.get('[data-testid="effects-saved"]').should('be.visible');
  });

  it('should handle audio visualization', () => {
    cy.get('[data-testid="visualization-tab"]').click();

    // Test visualization modes
    cy.get('[data-testid="viz-mode-waveform"]').click();
    cy.get('[data-testid="waveform-display"]').should('be.visible');

    cy.get('[data-testid="viz-mode-frequency"]').click();
    cy.get('[data-testid="frequency-display"]').should('be.visible');

    cy.get('[data-testid="viz-mode-spectrum"]').click();
    cy.get('[data-testid="spectrum-display"]').should('be.visible');

    // Test visualization settings
    cy.get('[data-testid="viz-sensitivity"]')
      .invoke('val', 0.9)
      .trigger('change');
    cy.get('[data-testid="viz-color-scheme"]').select('monochrome');

    // Test fullscreen mode
    cy.get('[data-testid="fullscreen-viz"]').click();
    cy.get('[data-testid="viz-container"]').should('have.class', 'fullscreen');
    cy.get('[data-testid="exit-fullscreen"]').click();
  });

  it('should handle audio recording', () => {
    cy.get('[data-testid="recording-tab"]').click();

    // Start recording
    cy.get('[data-testid="start-recording"]').click();
    cy.get('[data-testid="recording-status"]').should('contain', 'Recording');
    cy.get('[data-testid="recording-timer"]').should('be.visible');

    // Stop recording
    cy.get('[data-testid="stop-recording"]').click();
    cy.get('[data-testid="recording-status"]').should('contain', 'Stopped');

    // Play recording
    cy.get('[data-testid="play-recording"]').click();
    cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
    cy.get('[data-testid="pause-recording"]').click();
    cy.get('[data-testid="playback-status"]').should('contain', 'Paused');

    // Save recording
    cy.get('[data-testid="save-recording"]').click();
    cy.get('[data-testid="recording-name"]').type('Test Recording');
    cy.get('[data-testid="confirm-save"]').click();
    cy.get('[data-testid="recording-saved"]').should('be.visible');
  });

  it('should handle audio presets', () => {
    cy.get('[data-testid="presets-tab"]').click();

    // Browse presets
    cy.get('[data-testid="preset-list"]').should('be.visible');
    cy.get('[data-testid="preset-1"]').within(() => {
      cy.get('[data-testid="preset-name"]').should('contain', 'Ambient');
      cy.get('[data-testid="preset-description"]').should(
        'contain',
        'Smooth ambient sounds'
      );
    });

    // Load preset
    cy.get('[data-testid="load-preset-1"]').click();
    cy.get('[data-testid="preset-loaded"]').should('be.visible');
    cy.get('[data-testid="oscillator-type"]').should('have.value', 'sine');
    cy.get('[data-testid="frequency-slider"]').should('have.value', '220');

    // Create new preset
    cy.get('[data-testid="create-preset"]').click();
    cy.get('[data-testid="preset-name"]').type('Custom Preset');
    cy.get('[data-testid="preset-description"]').type('My custom preset');
    cy.get('[data-testid="save-preset"]').click();
    cy.get('[data-testid="preset-saved"]').should('be.visible');

    // Edit preset
    cy.get('[data-testid="edit-preset-1"]').click();
    cy.get('[data-testid="preset-name"]').clear().type('Updated Preset');
    cy.get('[data-testid="save-preset"]').click();
    cy.get('[data-testid="preset-updated"]').should('be.visible');

    // Delete preset
    cy.get('[data-testid="delete-preset-1"]').click();
    cy.get('[data-testid="confirm-delete"]').click();
    cy.get('[data-testid="preset-deleted"]').should('be.visible');
  });

  it('should handle audio analysis', () => {
    cy.get('[data-testid="analysis-tab"]').click();

    // Test frequency analysis
    cy.get('[data-testid="frequency-analysis"]').should('be.visible');
    cy.get('[data-testid="frequency-range"]').select('full');
    cy.get('[data-testid="frequency-scale"]').select('logarithmic');

    // Test waveform analysis
    cy.get('[data-testid="waveform-analysis"]').should('be.visible');
    cy.get('[data-testid="waveform-zoom"]').invoke('val', 2).trigger('change');

    // Test spectrum analysis
    cy.get('[data-testid="spectrum-analysis"]').should('be.visible');
    cy.get('[data-testid="spectrum-smoothing"]')
      .invoke('val', 0.5)
      .trigger('change');

    // Export analysis
    cy.get('[data-testid="export-analysis"]').click();
    cy.get('[data-testid="export-format"]').select('csv');
    cy.get('[data-testid="start-export"]').click();
    cy.get('[data-testid="analysis-exported"]').should('be.visible');
  });

  it('should handle audio synchronization', () => {
    // Test sync settings
    cy.get('[data-testid="sync-tab"]').click();
    cy.get('[data-testid="sync-mode"]').select('auto');
    cy.get('[data-testid="sync-source"]').select('physics');

    // Test manual sync
    cy.get('[data-testid="manual-sync"]').click();
    cy.get('[data-testid="sync-offset"]').invoke('val', 100).trigger('change');
    cy.get('[data-testid="apply-sync"]').click();
    cy.get('[data-testid="sync-applied"]').should('be.visible');

    // Test sync monitoring
    cy.get('[data-testid="sync-monitor"]').should('be.visible');
    cy.get('[data-testid="sync-status"]').should('contain', 'Synchronized');
    cy.get('[data-testid="sync-latency"]').should('contain', 'Latency: ');
  });

  it('should handle error states', () => {
    // Test audio context error
    cy.window().then(win => {
      win.dispatchEvent(new Event('audiocontexterror'));
    });
    cy.get('[data-testid="audio-error"]')
      .should('be.visible')
      .and('contain', 'Audio system error');

    // Test recording error
    cy.get('[data-testid="recording-tab"]').click();
    cy.get('[data-testid="start-recording"]').click();
    cy.window().then(win => {
      win.dispatchEvent(new Event('recordingerror'));
    });
    cy.get('[data-testid="recording-error"]')
      .should('be.visible')
      .and('contain', 'Recording failed');

    // Test preset loading error
    cy.get('[data-testid="presets-tab"]').click();
    cy.get('[data-testid="load-preset-1"]').click();
    cy.window().then(win => {
      win.dispatchEvent(new Event('preseterror'));
    });
    cy.get('[data-testid="preset-error"]')
      .should('be.visible')
      .and('contain', 'Failed to load preset');
  });
});
