describe('Audio System', () => {
  beforeEach(() => {
    cy.login();
    cy.createTestUniverse();
  });

  describe('Audio Controls', () => {
    it('should toggle audio playback', () => {
      cy.get('[data-testid="audio-play-button"]').click();
      cy.get('[data-testid="audio-play-button"]').should(
        'have.attr',
        'aria-label',
        'Pause'
      );
      cy.get('[data-testid="audio-play-button"]').click();
      cy.get('[data-testid="audio-play-button"]').should(
        'have.attr',
        'aria-label',
        'Play'
      );
    });

    it('should adjust volume', () => {
      cy.get('[data-testid="volume-slider"]')
        .invoke('val', 50)
        .trigger('change');
      cy.get('[data-testid="volume-slider"]').should('have.value', '50');
    });

    it('should mute/unmute audio', () => {
      cy.get('[data-testid="mute-button"]').click();
      cy.get('[data-testid="mute-button"]').should(
        'have.attr',
        'aria-label',
        'Unmute'
      );
      cy.get('[data-testid="mute-button"]').click();
      cy.get('[data-testid="mute-button"]').should(
        'have.attr',
        'aria-label',
        'Mute'
      );
    });
  });

  describe('Audio Processing', () => {
    it('should apply audio effects', () => {
      cy.get('[data-testid="effects-button"]').click();
      cy.get('[data-testid="reverb-amount"]')
        .invoke('val', 0.5)
        .trigger('change');
      cy.get('[data-testid="delay-amount"]')
        .invoke('val', 0.3)
        .trigger('change');
      cy.get('[data-testid="apply-effects"]').click();
      cy.contains('Effects applied');
    });

    it('should save audio settings', () => {
      cy.get('[data-testid="audio-settings-button"]').click();
      cy.get('[data-testid="quality-select"]').select('high');
      cy.get('[data-testid="spatial-audio-toggle"]').click();
      cy.get('[data-testid="save-settings"]').click();
      cy.contains('Settings saved');
    });
  });

  describe('Audio Visualization', () => {
    it('should display waveform', () => {
      cy.get('[data-testid="waveform-view"]').should('be.visible');
      cy.get('[data-testid="waveform-canvas"]').should('exist');
    });

    it('should update spectrum analyzer', () => {
      cy.get('[data-testid="spectrum-view"]').should('be.visible');
      cy.get('[data-testid="spectrum-canvas"]').should('exist');
    });
  });

  describe('Audio Recording', () => {
    it('should record audio', () => {
      cy.get('[data-testid="record-button"]').click();
      cy.wait(1000); // Simulate recording
      cy.get('[data-testid="stop-record-button"]').click();
      cy.get('[data-testid="recording-list"]')
        .children()
        .should('have.length.at.least', 1);
    });

    it('should play recorded audio', () => {
      cy.get('[data-testid="recording-list"]')
        .children()
        .first()
        .within(() => {
          cy.get('[data-testid="play-recording"]').click();
          cy.get('[data-testid="play-recording"]').should(
            'have.attr',
            'aria-label',
            'Pause'
          );
        });
    });
  });

  describe('Audio Export', () => {
    it('should export audio file', () => {
      cy.get('[data-testid="export-button"]').click();
      cy.get('[data-testid="format-select"]').select('wav');
      cy.get('[data-testid="quality-select"]').select('high');
      cy.get('[data-testid="confirm-export"]').click();
      cy.contains('Export complete');
    });
  });
});
