describe('Audio Features', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/audio');

    // Mock Tone.js
    cy.window().then(win => {
      win.Tone = {
        start: cy.stub().resolves(),
        Transport: {
          start: cy.stub(),
          stop: cy.stub(),
          bpm: { value: 120 },
        },
        Synth: class {
          connect() {}
          triggerAttackRelease() {}
          dispose() {}
        },
        now: () => 0,
      };
    });
  });

  describe('Music Player', () => {
    it('should initialize audio engine', () => {
      cy.get('[data-testid="music-player"]').should('be.visible');
      cy.get('[data-testid="play-button"]')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('should handle play/pause', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="play-button"]')
        .should('have.class', 'playing')
        .and('contain', 'Stop');

      // Stop playback
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="play-button"]')
        .should('not.have.class', 'playing')
        .and('contain', 'Play');
    });

    it('should handle export functionality', () => {
      cy.intercept('POST', '/api/audio/export', {
        statusCode: 200,
        body: {
          url: 'test-export.wav',
        },
      }).as('exportAudio');

      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="export-button"]').click();

      cy.wait('@exportAudio');
      cy.get('[data-testid="export-success"]').should('be.visible');
    });

    it('should handle audio engine errors', () => {
      // Mock audio initialization error
      cy.window().then(win => {
        win.Tone.start = cy
          .stub()
          .rejects(new Error('Audio initialization failed'));
      });

      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to initialize audio engine');
    });
  });

  describe('Music Controls', () => {
    it('should adjust harmony parameter', () => {
      cy.get('[data-testid="harmony-control"]').should('be.visible');
      cy.get('[data-testid="harmony-slider"]')
        .invoke('val', 0.5)
        .trigger('change');

      cy.get('[data-testid="harmony-value"]').should('contain', '0.5');
    });

    it('should adjust tempo', () => {
      cy.get('[data-testid="tempo-control"]').should('be.visible');
      cy.get('[data-testid="tempo-slider"]')
        .invoke('val', 140)
        .trigger('change');

      cy.get('[data-testid="tempo-value"]').should('contain', '140');
    });

    it('should change musical key', () => {
      cy.get('[data-testid="key-control"]').should('be.visible');
      cy.get('[data-testid="key-select"]').select('F#');
      cy.get('[data-testid="key-value"]').should('contain', 'F#');
    });

    it('should change scale', () => {
      cy.get('[data-testid="scale-control"]').should('be.visible');
      cy.get('[data-testid="scale-select"]').select('minor');
      cy.get('[data-testid="scale-value"]').should('contain', 'minor');
    });

    it('should adjust rhythm complexity', () => {
      cy.get('[data-testid="rhythm-complexity-control"]').should('be.visible');
      cy.get('[data-testid="rhythm-complexity-slider"]')
        .invoke('val', 0.7)
        .trigger('change');

      cy.get('[data-testid="rhythm-complexity-value"]').should(
        'contain',
        '0.7'
      );
    });

    it('should adjust melody range', () => {
      cy.get('[data-testid="melody-range-control"]').should('be.visible');
      cy.get('[data-testid="melody-range-slider"]')
        .invoke('val', 0.8)
        .trigger('change');

      cy.get('[data-testid="melody-range-value"]').should('contain', '0.8');
    });
  });

  describe('Transport Controls', () => {
    it('should handle transport controls', () => {
      // Play
      cy.get('[data-testid="transport-play"]').click();
      cy.get('[data-testid="transport-play"]')
        .should('have.class', 'playing')
        .and('contain', 'Stop');

      // Stop
      cy.get('[data-testid="transport-play"]').click();
      cy.get('[data-testid="transport-play"]')
        .should('not.have.class', 'playing')
        .and('contain', 'Play');
    });

    it('should handle export', () => {
      cy.intercept('POST', '/api/audio/export', {
        statusCode: 200,
        body: {
          url: 'test-export.wav',
        },
      }).as('exportAudio');

      cy.get('[data-testid="transport-play"]').click();
      cy.get('[data-testid="transport-export"]').click();

      cy.wait('@exportAudio');
      cy.get('[data-testid="export-success"]').should('be.visible');
    });
  });

  describe('Audio Engine Integration', () => {
    it('should initialize with default parameters', () => {
      cy.window().then(win => {
        expect(win.Tone.Transport.bpm.value).to.equal(120);
      });
    });

    it('should update parameters in real-time', () => {
      // Change tempo
      cy.get('[data-testid="tempo-slider"]')
        .invoke('val', 140)
        .trigger('change');

      cy.window().then(win => {
        expect(win.Tone.Transport.bpm.value).to.equal(140);
      });
    });

    it('should handle audio context suspension', () => {
      // Mock suspended audio context
      cy.window().then(win => {
        win.Tone.context = {
          state: 'suspended',
          resume: cy.stub().resolves(),
        };
      });

      cy.get('[data-testid="play-button"]').click();
      cy.window().then(win => {
        expect(win.Tone.context.resume).to.be.called;
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle audio initialization errors', () => {
      cy.window().then(win => {
        win.Tone.start = cy
          .stub()
          .rejects(new Error('Audio initialization failed'));
      });

      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to initialize audio engine');
    });

    it('should handle parameter update errors', () => {
      cy.window().then(win => {
        win.Tone.Transport.bpm.value = undefined;
      });

      cy.get('[data-testid="tempo-slider"]')
        .invoke('val', 140)
        .trigger('change');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to update tempo');
    });

    it('should handle export errors', () => {
      cy.intercept('POST', '/api/audio/export', {
        statusCode: 500,
        body: {
          error: 'Export failed',
        },
      }).as('exportError');

      cy.get('[data-testid="transport-play"]').click();
      cy.get('[data-testid="transport-export"]').click();

      cy.wait('@exportError');
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Export failed');
    });
  });

  describe('Performance', () => {
    it('should handle rapid parameter changes', () => {
      // Simulate rapid tempo changes
      for (let tempo = 60; tempo <= 180; tempo += 20) {
        cy.get('[data-testid="tempo-slider"]')
          .invoke('val', tempo)
          .trigger('change');
      }

      // Verify no errors occurred
      cy.get('[data-testid="error-message"]').should('not.exist');
    });

    it('should handle multiple play/pause cycles', () => {
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="play-button"]').click();
        cy.get('[data-testid="play-button"]').should('have.class', 'playing');
        cy.get('[data-testid="play-button"]').click();
        cy.get('[data-testid="play-button"]').should(
          'not.have.class',
          'playing'
        );
      }

      // Verify audio engine is still responsive
      cy.get('[data-testid="play-button"]').should('not.be.disabled');
    });
  });
});
