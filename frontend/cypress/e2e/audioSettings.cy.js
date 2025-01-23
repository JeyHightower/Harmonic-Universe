describe('Audio Settings Operations', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('testuser@example.com', 'password123');

    // Create a test universe if needed
    cy.createTestUniverse().as('universeId');
  });

  describe('Create Audio Settings', () => {
    it('should create new audio settings', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);

        // Set volume controls
        cy.get('[data-testid="master-volume-slider"]')
          .invoke('val', 0.8)
          .trigger('change');
        cy.get('[data-testid="effects-volume-slider"]')
          .invoke('val', 0.6)
          .trigger('change');

        // Set audio effects
        cy.get('[data-testid="reverb-amount"]')
          .invoke('val', 0.3)
          .trigger('change');
        cy.get('[data-testid="delay-time"]')
          .invoke('val', 0.4)
          .trigger('change');

        // Save settings
        cy.get('[data-testid="save-audio-settings"]').click();

        // Verify success
        cy.contains('Audio settings saved successfully').should('be.visible');
      });
    });

    it('should validate volume ranges', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);

        // Try invalid volume
        cy.get('[data-testid="master-volume-slider"]')
          .invoke('val', 1.5)
          .trigger('change');
        cy.contains('Volume must be between 0 and 1').should('be.visible');
      });
    });
  });

  describe('Read Audio Settings', () => {
    it('should load existing settings', () => {
      cy.get('@universeId').then(universeId => {
        // Create test settings first
        cy.createTestAudioSettings(universeId);

        // Visit audio page
        cy.visit(`/universe/${universeId}/audio`);

        // Verify settings are loaded
        cy.get('[data-testid="master-volume-slider"]').should(
          'have.value',
          '0.8'
        );
        cy.get('[data-testid="effects-volume-slider"]').should(
          'have.value',
          '0.6'
        );
        cy.get('[data-testid="reverb-amount"]').should('have.value', '0.3');
      });
    });

    it('should show loading state', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);
        cy.get('[data-testid="loading-indicator"]').should('be.visible');
      });
    });
  });

  describe('Update Audio Settings', () => {
    beforeEach(() => {
      cy.get('@universeId').then(universeId => {
        cy.createTestAudioSettings(universeId);
      });
    });

    it('should update settings', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);

        // Update settings
        cy.get('[data-testid="master-volume-slider"]')
          .invoke('val', 0.7)
          .trigger('change');
        cy.get('[data-testid="effects-volume-slider"]')
          .invoke('val', 0.5)
          .trigger('change');

        // Save changes
        cy.get('[data-testid="save-audio-settings"]').click();

        // Verify updates
        cy.contains('Audio settings updated successfully').should('be.visible');
        cy.get('[data-testid="master-volume-slider"]').should(
          'have.value',
          '0.7'
        );
        cy.get('[data-testid="effects-volume-slider"]').should(
          'have.value',
          '0.5'
        );
      });
    });
  });

  describe('Delete Audio Settings', () => {
    beforeEach(() => {
      cy.get('@universeId').then(universeId => {
        cy.createTestAudioSettings(universeId);
      });
    });

    it('should reset settings', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);

        // Click reset button
        cy.get('[data-testid="reset-audio-settings"]').click();

        // Confirm reset
        cy.get('[data-testid="confirm-reset"]').click();

        // Verify reset
        cy.contains('Audio settings reset successfully').should('be.visible');
        cy.get('[data-testid="master-volume-slider"]').should(
          'have.value',
          '1.0'
        ); // Default value
      });
    });

    it('should cancel reset', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);

        // Click reset button
        cy.get('[data-testid="reset-audio-settings"]').click();

        // Cancel reset
        cy.get('[data-testid="cancel-reset"]').click();

        // Verify settings remain unchanged
        cy.get('[data-testid="master-volume-slider"]').should(
          'have.value',
          '0.8'
        );
      });
    });
  });

  describe('Audio Preview', () => {
    it('should preview audio settings', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/audio`);

        // Click preview button
        cy.get('[data-testid="preview-audio"]').click();

        // Verify audio playback
        cy.get('[data-testid="audio-player"]').should('be.visible');
        cy.get('[data-testid="audio-player"]').should(
          'have.prop',
          'paused',
          false
        );
      });
    });
  });
});
