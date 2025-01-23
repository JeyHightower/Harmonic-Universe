describe('Music Parameters Operations', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('testuser@example.com', 'password123');

    // Create a test universe if needed
    cy.createTestUniverse().as('universeId');
  });

  describe('Create Music Parameters', () => {
    it('should create new music parameters', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/music`);

        // Set basic parameters
        cy.get('[data-testid="tempo-slider"]')
          .invoke('val', 120)
          .trigger('change');
        cy.get('[data-testid="key-select"]').select('C');
        cy.get('[data-testid="scale-select"]').select('major');

        // Set advanced parameters
        cy.get('[data-testid="harmony-slider"]')
          .invoke('val', 0.7)
          .trigger('change');
        cy.get('[data-testid="reverb-slider"]')
          .invoke('val', 0.3)
          .trigger('change');

        // Save parameters
        cy.get('[data-testid="save-parameters-button"]').click();

        // Verify success
        cy.contains('Parameters saved successfully').should('be.visible');
      });
    });

    it('should validate parameter ranges', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/music`);

        // Try invalid tempo
        cy.get('[data-testid="tempo-slider"]')
          .invoke('val', 300)
          .trigger('change');
        cy.contains('Tempo must be between 40 and 200').should('be.visible');
      });
    });
  });

  describe('Read Music Parameters', () => {
    it('should load existing parameters', () => {
      cy.get('@universeId').then(universeId => {
        // Create test parameters first
        cy.createTestMusicParameters(universeId);

        // Visit music page
        cy.visit(`/universe/${universeId}/music`);

        // Verify parameters are loaded
        cy.get('[data-testid="tempo-slider"]').should('have.value', '120');
        cy.get('[data-testid="key-select"]').should('have.value', 'C');
        cy.get('[data-testid="scale-select"]').should('have.value', 'major');
      });
    });

    it('should show loading state', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/music`);
        cy.get('[data-testid="loading-indicator"]').should('be.visible');
      });
    });
  });

  describe('Update Music Parameters', () => {
    beforeEach(() => {
      cy.get('@universeId').then(universeId => {
        cy.createTestMusicParameters(universeId);
      });
    });

    it('should update parameters', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/music`);

        // Update parameters
        cy.get('[data-testid="tempo-slider"]')
          .invoke('val', 140)
          .trigger('change');
        cy.get('[data-testid="key-select"]').select('G');

        // Save changes
        cy.get('[data-testid="save-parameters-button"]').click();

        // Verify updates
        cy.contains('Parameters updated successfully').should('be.visible');
        cy.get('[data-testid="tempo-slider"]').should('have.value', '140');
        cy.get('[data-testid="key-select"]').should('have.value', 'G');
      });
    });
  });

  describe('Delete Music Parameters', () => {
    beforeEach(() => {
      cy.get('@universeId').then(universeId => {
        cy.createTestMusicParameters(universeId);
      });
    });

    it('should reset parameters', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/music`);

        // Click reset button
        cy.get('[data-testid="reset-parameters-button"]').click();

        // Confirm reset
        cy.get('[data-testid="confirm-reset-button"]').click();

        // Verify reset
        cy.contains('Parameters reset successfully').should('be.visible');
        cy.get('[data-testid="tempo-slider"]').should('have.value', '120'); // Default value
      });
    });
  });

  describe('AI Music Generation', () => {
    it('should generate AI music', () => {
      cy.get('@universeId').then(universeId => {
        cy.visit(`/universe/${universeId}/music`);

        // Set AI parameters
        cy.get('[data-testid="complexity-slider"]')
          .invoke('val', 0.7)
          .trigger('change');
        cy.get('[data-testid="mood-select"]').select('energetic');

        // Generate music
        cy.get('[data-testid="generate-ai-button"]').click();

        // Verify generation
        cy.contains('Music generated successfully').should('be.visible');
        cy.get('[data-testid="audio-player"]').should('be.visible');
      });
    });

    it('should apply style transfer', () => {
      cy.get('@universeId').then(universeId => {
        // Create source universe with parameters
        cy.createTestUniverse().then(sourceId => {
          cy.createTestMusicParameters(sourceId);

          // Visit target universe
          cy.visit(`/universe/${universeId}/music`);

          // Select source universe
          cy.get('[data-testid="source-universe-select"]').select(
            sourceId.toString()
          );

          // Apply style transfer
          cy.get('[data-testid="style-transfer-button"]').click();

          // Verify transfer
          cy.contains('Style transfer completed').should('be.visible');
        });
      });
    });
  });
});
