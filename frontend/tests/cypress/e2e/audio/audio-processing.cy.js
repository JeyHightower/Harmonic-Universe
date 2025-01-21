describe('Audio Processing', () => {
  beforeEach(() => {
    // Login and setup mock data
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
        name: 'Audio Universe',
        description: 'A test universe',
        owner_id: 1,
        audio_params: {
          harmony: 0.8,
          rhythm: 120,
          timbre: 0.6,
        },
      },
    }).as('getUniverse');

    // Mock audio context
    cy.window().then(win => {
      win.AudioContext = class MockAudioContext {
        constructor() {
          this.state = 'running';
          this.sampleRate = 44100;
        }
        createAnalyser() {
          return {
            connect: () => {},
            disconnect: () => {},
            getByteFrequencyData: () => {},
            getByteTimeDomainData: () => {},
          };
        }
        createOscillator() {
          return {
            connect: () => {},
            disconnect: () => {},
            start: () => {},
            stop: () => {},
          };
        }
        createGain() {
          return {
            connect: () => {},
            disconnect: () => {},
            gain: { value: 1 },
          };
        }
      };
    });

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universe/1/audio');
    cy.wait('@getUniverse');
  });

  it('should display audio controls', () => {
    cy.get('[data-testid="audio-controls"]').should('be.visible');
    cy.get('[data-testid="waveform-display"]').should('be.visible');
    cy.get('[data-testid="frequency-display"]').should('be.visible');
  });

  it('should handle real-time visualization', () => {
    cy.get('[data-testid="visualization-toggle"]').click();
    cy.get('[data-testid="audio-visualizer"]').should('be.visible');

    // Simulate audio data
    cy.window().then(win => {
      const audioData = new Uint8Array(128);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.random() * 255;
      }
      win.dispatchEvent(new CustomEvent('audiodata', { detail: audioData }));
    });

    cy.get('[data-testid="visualization-canvas"]').should(
      'have.attr',
      'data-active',
      'true'
    );
  });

  it('should handle frequency analysis', () => {
    cy.get('[data-testid="frequency-analyzer"]').should('be.visible');

    // Toggle different frequency views
    cy.get('[data-testid="frequency-view-linear"]').click();
    cy.get('[data-testid="frequency-display"]').should(
      'have.attr',
      'data-view',
      'linear'
    );

    cy.get('[data-testid="frequency-view-logarithmic"]').click();
    cy.get('[data-testid="frequency-display"]').should(
      'have.attr',
      'data-view',
      'logarithmic'
    );
  });

  it('should handle waveform display', () => {
    cy.get('[data-testid="waveform-display"]').should('be.visible');

    // Toggle different waveform views
    cy.get('[data-testid="waveform-view-line"]').click();
    cy.get('[data-testid="waveform-canvas"]').should(
      'have.attr',
      'data-view',
      'line'
    );

    cy.get('[data-testid="waveform-view-bars"]').click();
    cy.get('[data-testid="waveform-canvas"]').should(
      'have.attr',
      'data-view',
      'bars'
    );
  });

  it('should handle audio effects', () => {
    cy.get('[data-testid="effects-panel"]').should('be.visible');

    // Test reverb effect
    cy.get('[data-testid="effect-reverb"]').click();
    cy.get('[data-testid="reverb-amount"]').clear().type('0.7');
    cy.get('[data-testid="effect-reverb"]').should(
      'have.attr',
      'data-active',
      'true'
    );

    // Test delay effect
    cy.get('[data-testid="effect-delay"]').click();
    cy.get('[data-testid="delay-time"]').clear().type('0.5');
    cy.get('[data-testid="effect-delay"]').should(
      'have.attr',
      'data-active',
      'true'
    );
  });

  it('should handle sound synthesis', () => {
    cy.get('[data-testid="synthesis-panel"]').should('be.visible');

    // Test oscillator
    cy.get('[data-testid="oscillator-type"]').select('sine');
    cy.get('[data-testid="oscillator-frequency"]').clear().type('440');
    cy.get('[data-testid="oscillator-start"]').click();

    cy.get('[data-testid="oscillator"]').should(
      'have.attr',
      'data-playing',
      'true'
    );
  });

  it('should handle audio recording', () => {
    // Mock MediaRecorder
    cy.window().then(win => {
      win.MediaRecorder = class MockMediaRecorder {
        constructor() {
          this.state = 'inactive';
        }
        start() {
          this.state = 'recording';
          this.ondataavailable({ data: new Blob() });
        }
        stop() {
          this.state = 'inactive';
          this.onstop();
        }
      };
    });

    cy.get('[data-testid="record-button"]').click();
    cy.get('[data-testid="recording-indicator"]').should('be.visible');

    cy.wait(1000);
    cy.get('[data-testid="stop-recording"]').click();
    cy.get('[data-testid="recording-playback"]').should('be.visible');
  });

  it('should handle audio playback', () => {
    cy.intercept('GET', '/api/audio/samples/1', {
      statusCode: 200,
      body: new ArrayBuffer(1024),
    }).as('getAudioSample');

    cy.get('[data-testid="sample-library"]').click();
    cy.get('[data-testid="sample-1"]').click();

    cy.get('[data-testid="playback-controls"]').should('be.visible');
    cy.get('[data-testid="play-button"]').should(
      'have.attr',
      'data-playing',
      'true'
    );
  });

  it('should handle audio export', () => {
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-format-wav"]').click();

    cy.get('[data-testid="export-progress"]').should('be.visible');
    cy.contains('Export completed').should('be.visible');
  });

  it('should handle audio import', () => {
    const testFile = new File(['test audio content'], 'test.wav', {
      type: 'audio/wav',
    });
    cy.get('[data-testid="import-button"]').attachFile(testFile);

    cy.get('[data-testid="import-progress"]').should('be.visible');
    cy.contains('Import completed').should('be.visible');
  });

  it('should handle audio library', () => {
    cy.intercept('GET', '/api/audio/library', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Sample 1', duration: 30 },
        { id: 2, name: 'Sample 2', duration: 45 },
      ],
    }).as('getLibrary');

    cy.get('[data-testid="library-button"]').click();
    cy.get('[data-testid="audio-library"]').should('be.visible');

    cy.get('[data-testid="library-item"]').should('have.length', 2);
    cy.contains('Sample 1').should('be.visible');
  });

  it('should handle parameter synchronization', () => {
    // Change audio parameters
    cy.get('[data-testid="harmony-slider"]')
      .invoke('val', 0.6)
      .trigger('change');
    cy.get('[data-testid="rhythm-slider"]').invoke('val', 90).trigger('change');

    // Verify changes are reflected in visualization
    cy.get('[data-testid="audio-visualizer"]')
      .should('have.attr', 'data-harmony', '0.6')
      .should('have.attr', 'data-rhythm', '90');
  });

  it('should handle error states', () => {
    // Simulate audio context error
    cy.window().then(win => {
      win.dispatchEvent(
        new ErrorEvent('audiocontexterror', {
          error: new Error('Audio context failed to start'),
        })
      );
    });

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Audio system error');

    cy.get('[data-testid="retry-button"]').click();
    cy.get('[data-testid="audio-controls"]').should('be.visible');
  });
});
