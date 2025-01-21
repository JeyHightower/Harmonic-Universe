describe('Audio System', () => {
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
        name: 'Audio Test Universe',
        description: 'A test universe',
        owner_id: 1,
        audio_params: {
          harmony: 0.8,
          rhythm: 120,
          timbre: 0.6,
          effects: ['reverb', 'delay'],
          synthesis: {
            oscillator: 'sine',
            frequency: 440,
            detune: 0,
          },
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
            fftSize: 2048,
            frequencyBinCount: 1024,
          };
        }
        createOscillator() {
          return {
            connect: () => {},
            disconnect: () => {},
            start: () => {},
            stop: () => {},
            frequency: { value: 440 },
            type: 'sine',
          };
        }
        createGain() {
          return {
            connect: () => {},
            disconnect: () => {},
            gain: { value: 1 },
          };
        }
        createBiquadFilter() {
          return {
            connect: () => {},
            disconnect: () => {},
            frequency: { value: 1000 },
            Q: { value: 1 },
            type: 'lowpass',
          };
        }
        createDelay() {
          return {
            connect: () => {},
            disconnect: () => {},
            delayTime: { value: 0.5 },
          };
        }
        createConvolver() {
          return {
            connect: () => {},
            disconnect: () => {},
            buffer: null,
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

  it('should handle audio initialization', () => {
    // Verify audio context creation
    cy.window().then(win => {
      expect(win.audioContext).to.be.instanceOf(win.AudioContext);
    });

    // Verify audio controls
    cy.get('[data-testid="audio-controls"]').should('be.visible');
    cy.get('[data-testid="master-volume"]').should('exist');
    cy.get('[data-testid="audio-power"]').should('exist');
  });

  it('should handle real-time visualization', () => {
    // Test waveform display
    cy.get('[data-testid="waveform-display"]').should('be.visible');
    cy.get('[data-testid="waveform-canvas"]')
      .should('have.attr', 'width')
      .and('not.eq', '0');

    // Test frequency display
    cy.get('[data-testid="frequency-display"]').should('be.visible');
    cy.get('[data-testid="frequency-canvas"]')
      .should('have.attr', 'width')
      .and('not.eq', '0');

    // Simulate audio data
    cy.window().then(win => {
      const audioData = new Float32Array(1024);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i / 10);
      }
      win.dispatchEvent(new CustomEvent('audiodata', { detail: audioData }));
    });

    // Verify visualization update
    cy.get('[data-testid="visualization-active"]').should('exist');
  });

  it('should handle frequency analysis', () => {
    // Test analyzer settings
    cy.get('[data-testid="analyzer-settings"]').click();
    cy.get('[data-testid="fft-size"]').select('2048');
    cy.get('[data-testid="smoothing"]').invoke('val', 0.8).trigger('change');

    // Test frequency bands
    cy.get('[data-testid="frequency-bands"]').should('be.visible');
    cy.get('[data-testid="band-low"]').should('exist');
    cy.get('[data-testid="band-mid"]').should('exist');
    cy.get('[data-testid="band-high"]').should('exist');

    // Test visualization modes
    cy.get('[data-testid="viz-mode"]').select('bars');
    cy.get('[data-testid="frequency-display"]').should(
      'have.class',
      'bars-mode'
    );
  });

  it('should handle audio effects', () => {
    // Open effects panel
    cy.get('[data-testid="effects-panel"]').click();

    // Test reverb
    cy.get('[data-testid="effect-reverb"]').click();
    cy.get('[data-testid="reverb-size"]').invoke('val', 0.8).trigger('change');
    cy.get('[data-testid="reverb-damping"]')
      .invoke('val', 0.5)
      .trigger('change');
    cy.get('[data-testid="effect-reverb"]').should(
      'have.class',
      'effect-active'
    );

    // Test delay
    cy.get('[data-testid="effect-delay"]').click();
    cy.get('[data-testid="delay-time"]').invoke('val', 0.3).trigger('change');
    cy.get('[data-testid="delay-feedback"]')
      .invoke('val', 0.4)
      .trigger('change');
    cy.get('[data-testid="effect-delay"]').should(
      'have.class',
      'effect-active'
    );

    // Test effect chain
    cy.get('[data-testid="effect-chain"]').within(() => {
      cy.get('[data-testid="effect-1"]').should('contain', 'Reverb');
      cy.get('[data-testid="effect-2"]').should('contain', 'Delay');
    });
  });

  it('should handle sound synthesis', () => {
    // Open synthesis panel
    cy.get('[data-testid="synthesis-panel"]').click();

    // Test oscillator
    cy.get('[data-testid="oscillator-type"]').select('sine');
    cy.get('[data-testid="oscillator-frequency"]').clear().type('440');
    cy.get('[data-testid="oscillator-detune"]')
      .invoke('val', 0)
      .trigger('change');

    // Start oscillator
    cy.get('[data-testid="oscillator-start"]').click();
    cy.get('[data-testid="oscillator"]').should(
      'have.class',
      'oscillator-active'
    );

    // Test envelope
    cy.get('[data-testid="envelope-attack"]')
      .invoke('val', 0.1)
      .trigger('change');
    cy.get('[data-testid="envelope-decay"]')
      .invoke('val', 0.2)
      .trigger('change');
    cy.get('[data-testid="envelope-sustain"]')
      .invoke('val', 0.7)
      .trigger('change');
    cy.get('[data-testid="envelope-release"]')
      .invoke('val', 0.3)
      .trigger('change');
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

    // Start recording
    cy.get('[data-testid="record-button"]').click();
    cy.get('[data-testid="recording-indicator"]').should('be.visible');
    cy.get('[data-testid="record-timer"]').should('exist');

    // Stop recording
    cy.wait(1000);
    cy.get('[data-testid="stop-recording"]').click();

    // Verify recording controls
    cy.get('[data-testid="recording-playback"]').should('be.visible');
    cy.get('[data-testid="play-recording"]').should('exist');
    cy.get('[data-testid="download-recording"]').should('exist');
  });

  it('should handle audio playback', () => {
    // Mock audio buffer
    cy.intercept('GET', '/api/audio/samples/1', {
      statusCode: 200,
      body: new ArrayBuffer(1024),
    }).as('getAudioSample');

    // Load audio sample
    cy.get('[data-testid="load-sample"]').click();
    cy.get('[data-testid="sample-1"]').click();
    cy.wait('@getAudioSample');

    // Test playback controls
    cy.get('[data-testid="playback-controls"]').should('be.visible');
    cy.get('[data-testid="play-button"]').click();
    cy.get('[data-testid="pause-button"]').should('exist');
    cy.get('[data-testid="stop-button"]').should('exist');

    // Test transport controls
    cy.get('[data-testid="seek-slider"]').invoke('val', 50).trigger('change');
    cy.get('[data-testid="playback-rate"]')
      .invoke('val', 1.5)
      .trigger('change');
  });

  it('should handle audio export', () => {
    // Configure export settings
    cy.get('[data-testid="export-settings"]').click();
    cy.get('[data-testid="export-format"]').select('wav');
    cy.get('[data-testid="sample-rate"]').select('44100');
    cy.get('[data-testid="bit-depth"]').select('16');

    // Start export
    cy.get('[data-testid="start-export"]').click();
    cy.get('[data-testid="export-progress"]').should('be.visible');

    // Verify export completion
    cy.get('[data-testid="export-complete"]').should('be.visible');
    cy.get('[data-testid="download-export"]')
      .should('have.attr', 'href')
      .and('include', '.wav');
  });

  it('should handle audio import', () => {
    const testFile = new File(['test audio content'], 'test.wav', {
      type: 'audio/wav',
    });

    // Test file upload
    cy.get('[data-testid="import-audio"]').attachFile(testFile);
    cy.get('[data-testid="import-progress"]').should('be.visible');

    // Verify import
    cy.get('[data-testid="import-complete"]').should('be.visible');
    cy.get('[data-testid="imported-audio"]').should('exist');
  });

  it('should handle audio library', () => {
    // Mock library data
    cy.intercept('GET', '/api/audio/library', {
      statusCode: 200,
      body: {
        samples: [
          { id: 1, name: 'Sample 1', duration: 30 },
          { id: 2, name: 'Sample 2', duration: 45 },
        ],
      },
    }).as('getLibrary');

    // Open library
    cy.get('[data-testid="audio-library"]').click();
    cy.wait('@getLibrary');

    // Verify library content
    cy.get('[data-testid="library-items"]').should('have.length', 2);
    cy.get('[data-testid="sample-1"]').should('contain', 'Sample 1');
    cy.get('[data-testid="sample-2"]').should('contain', 'Sample 2');

    // Test sample preview
    cy.get('[data-testid="sample-1"]')
      .find('[data-testid="preview-button"]')
      .click();
    cy.get('[data-testid="preview-player"]').should('be.visible');
  });

  it('should handle error states', () => {
    // Test audio context error
    cy.window().then(win => {
      win.dispatchEvent(
        new ErrorEvent('audiocontexterror', {
          error: new Error('Audio context failed to start'),
        })
      );
    });

    cy.get('[data-testid="audio-error"]')
      .should('be.visible')
      .and('contain', 'Audio system error');

    // Test unsupported feature
    cy.get('[data-testid="effect-unsupported"]').click();
    cy.get('[data-testid="feature-error"]')
      .should('be.visible')
      .and('contain', 'Feature not supported');

    // Test recovery
    cy.get('[data-testid="retry-audio"]').click();
    cy.get('[data-testid="audio-controls"]').should('be.visible');
  });
});
