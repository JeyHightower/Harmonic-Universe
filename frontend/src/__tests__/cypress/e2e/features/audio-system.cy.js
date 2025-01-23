describe('Audio System Features', () => {
  beforeEach(() => {
    // Mock authentication
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
        sampleRate: 44100,
        bitDepth: 16,
        channels: 2,
        bufferSize: 1024,
        effects: {
          reverb: { enabled: false, mix: 0.3, decay: 2.0 },
          delay: { enabled: false, time: 0.5, feedback: 0.4 },
          compression: { enabled: false, threshold: -24, ratio: 4 },
        },
      },
    }).as('getAudioSettings');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/audio');
    cy.wait('@getAudioSettings');
  });

  describe('Audio Initialization', () => {
    it('should initialize audio context', () => {
      cy.window().then(win => {
        expect(win.audioContext).to.exist;
        expect(win.audioContext.state).to.equal('running');
      });

      cy.get('[data-testid="audio-status"]')
        .should('have.class', 'initialized')
        .and('contain', 'Audio Ready');
    });

    it('should handle audio permissions', () => {
      cy.intercept('GET', '/api/audio/permissions', {
        statusCode: 200,
        body: {
          microphone: true,
          playback: true,
        },
      }).as('getPermissions');

      cy.get('[data-testid="request-permissions"]').click();
      cy.wait('@getPermissions');

      cy.get('[data-testid="permission-status"]')
        .should('contain', 'Microphone: Granted')
        .and('contain', 'Playback: Granted');
    });
  });

  describe('Audio Processing', () => {
    it('should handle real-time processing', () => {
      // Mock audio processing data
      cy.intercept('POST', '/api/audio/process', {
        statusCode: 200,
        body: {
          processed: true,
          duration: 1000,
          peaks: [-1, 1],
        },
      }).as('processAudio');

      // Start processing
      cy.get('[data-testid="start-processing"]').click();
      cy.get('[data-testid="processing-status"]').should(
        'contain',
        'Processing'
      );
      cy.wait('@processAudio');

      // Verify visualization
      cy.get('[data-testid="waveform-display"]').should('be.visible');
      cy.get('[data-testid="peak-meter"]')
        .should('have.attr', 'data-min', '-1')
        .and('have.attr', 'data-max', '1');
    });

    it('should handle frequency analysis', () => {
      cy.intercept('GET', '/api/audio/analysis/frequency', {
        statusCode: 200,
        body: {
          frequencies: new Array(1024).fill(0),
          bands: {
            low: 0.5,
            mid: 0.3,
            high: 0.2,
          },
        },
      }).as('getFrequency');

      cy.get('[data-testid="frequency-analysis"]').click();
      cy.wait('@getFrequency');

      cy.get('[data-testid="frequency-display"]').should('be.visible');
      cy.get('[data-testid="frequency-bands"]').within(() => {
        cy.get('[data-testid="band-low"]').should('contain', '50%');
        cy.get('[data-testid="band-mid"]').should('contain', '30%');
        cy.get('[data-testid="band-high"]').should('contain', '20%');
      });
    });
  });

  describe('Audio Effects', () => {
    it('should apply reverb effect', () => {
      cy.intercept('PUT', '/api/audio/effects/reverb', {
        statusCode: 200,
        body: {
          enabled: true,
          mix: 0.5,
          decay: 3.0,
        },
      }).as('updateReverb');

      cy.get('[data-testid="effect-reverb"]').click();
      cy.get('[data-testid="reverb-mix"]').invoke('val', 0.5).trigger('change');
      cy.get('[data-testid="reverb-decay"]')
        .invoke('val', 3.0)
        .trigger('change');
      cy.get('[data-testid="apply-reverb"]').click();
      cy.wait('@updateReverb');

      cy.get('[data-testid="effect-reverb"]').should('have.class', 'active');
    });

    it('should apply delay effect', () => {
      cy.intercept('PUT', '/api/audio/effects/delay', {
        statusCode: 200,
        body: {
          enabled: true,
          time: 0.3,
          feedback: 0.6,
        },
      }).as('updateDelay');

      cy.get('[data-testid="effect-delay"]').click();
      cy.get('[data-testid="delay-time"]').invoke('val', 0.3).trigger('change');
      cy.get('[data-testid="delay-feedback"]')
        .invoke('val', 0.6)
        .trigger('change');
      cy.get('[data-testid="apply-delay"]').click();
      cy.wait('@updateDelay');

      cy.get('[data-testid="effect-delay"]').should('have.class', 'active');
    });

    it('should apply compression', () => {
      cy.intercept('PUT', '/api/audio/effects/compression', {
        statusCode: 200,
        body: {
          enabled: true,
          threshold: -20,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
        },
      }).as('updateCompression');

      cy.get('[data-testid="effect-compression"]').click();
      cy.get('[data-testid="compression-threshold"]')
        .invoke('val', -20)
        .trigger('change');
      cy.get('[data-testid="compression-ratio"]')
        .invoke('val', 4)
        .trigger('change');
      cy.get('[data-testid="apply-compression"]').click();
      cy.wait('@updateCompression');

      cy.get('[data-testid="effect-compression"]').should(
        'have.class',
        'active'
      );
    });
  });

  describe('Audio Recording', () => {
    it('should handle recording', () => {
      cy.intercept('POST', '/api/audio/recordings', {
        statusCode: 200,
        body: {
          id: 1,
          duration: 5000,
          url: 'https://example.com/recording.wav',
        },
      }).as('saveRecording');

      // Start recording
      cy.get('[data-testid="start-recording"]').click();
      cy.get('[data-testid="recording-status"]').should('contain', 'Recording');

      // Stop recording after 5 seconds
      cy.wait(5000);
      cy.get('[data-testid="stop-recording"]').click();
      cy.wait('@saveRecording');

      cy.get('[data-testid="recording-list"]')
        .should('contain', 'recording.wav')
        .and('contain', '5 seconds');
    });

    it('should handle playback', () => {
      cy.intercept('GET', '/api/audio/recordings/1', {
        statusCode: 200,
        body: {
          url: 'https://example.com/recording.wav',
          duration: 5000,
        },
      }).as('getRecording');

      cy.get('[data-testid="recording-1"]').click();
      cy.get('[data-testid="play-recording"]').click();
      cy.wait('@getRecording');

      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      cy.get('[data-testid="playback-progress"]').should('exist');
    });
  });

  describe('Audio Export', () => {
    it('should export audio file', () => {
      cy.intercept('POST', '/api/audio/export', {
        statusCode: 200,
        body: {
          url: 'https://example.com/export.wav',
          format: 'wav',
          size: 1024000,
        },
      }).as('exportAudio');

      cy.get('[data-testid="export-audio"]').click();
      cy.get('[data-testid="export-format"]').select('wav');
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@exportAudio');

      cy.get('[data-testid="download-export"]')
        .should('have.attr', 'href')
        .and('include', 'export.wav');
    });

    it('should handle export settings', () => {
      cy.get('[data-testid="export-audio"]').click();
      cy.get('[data-testid="export-format"]').select('mp3');
      cy.get('[data-testid="export-quality"]').select('320');
      cy.get('[data-testid="normalize-audio"]').check();

      cy.get('[data-testid="export-settings"]').should(
        'contain',
        'MP3 320kbps'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', () => {
      cy.intercept('GET', '/api/audio/settings', {
        statusCode: 500,
        body: {
          error: 'Failed to initialize audio',
        },
      }).as('initError');

      cy.reload();
      cy.wait('@initError');

      cy.get('[data-testid="audio-error"]')
        .should('be.visible')
        .and('contain', 'Failed to initialize audio');
    });

    it('should handle processing errors', () => {
      cy.intercept('POST', '/api/audio/process', {
        statusCode: 500,
        body: {
          error: 'Processing failed',
        },
      }).as('processError');

      cy.get('[data-testid="start-processing"]').click();
      cy.wait('@processError');

      cy.get('[data-testid="processing-error"]')
        .should('be.visible')
        .and('contain', 'Processing failed');
    });

    it('should handle recording errors', () => {
      // Simulate microphone access denial
      cy.window().then(win => {
        win.navigator.mediaDevices.getUserMedia = () =>
          Promise.reject(new Error('Permission denied'));
      });

      cy.get('[data-testid="start-recording"]').click();

      cy.get('[data-testid="recording-error"]')
        .should('be.visible')
        .and('contain', 'Permission denied');
    });
  });
});
