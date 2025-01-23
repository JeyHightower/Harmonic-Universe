describe('Export & Import Features', () => {
  beforeEach(() => {
    // Mock login
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
        name: 'Test Universe',
        description: 'A test universe',
        physics_params: {
          particle_count: 1000,
          gravity: 9.81,
          friction: 0.5,
        },
        audio_params: {
          sample_rate: 44100,
          channels: 2,
          bit_depth: 16,
        },
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-20T12:00:00Z',
      },
    }).as('getUniverse');

    // Mock export formats
    cy.intercept('GET', '/api/export/formats', {
      statusCode: 200,
      body: {
        formats: [
          {
            id: 'json',
            name: 'JSON',
            description: 'Export as JSON file',
            supports_physics: true,
            supports_audio: true,
          },
          {
            id: 'fbx',
            name: 'FBX',
            description: 'Export as FBX file',
            supports_physics: true,
            supports_audio: false,
          },
          {
            id: 'wav',
            name: 'WAV',
            description: 'Export audio as WAV',
            supports_physics: false,
            supports_audio: true,
          },
        ],
      },
    }).as('getExportFormats');

    // Login and navigate
    cy.login();
    cy.visit('/universes/1/export');
    cy.wait(['@getUniverse', '@getExportFormats']);
  });

  describe('Export', () => {
    it('should display export options', () => {
      cy.get('[data-testid="export-formats"]').within(() => {
        // JSON format
        cy.get('[data-testid="format-json"]')
          .should('contain', 'JSON')
          .and('contain', 'Export as JSON file');

        // FBX format
        cy.get('[data-testid="format-fbx"]')
          .should('contain', 'FBX')
          .and('contain', 'Export as FBX file');

        // WAV format
        cy.get('[data-testid="format-wav"]')
          .should('contain', 'WAV')
          .and('contain', 'Export audio as WAV');
      });
    });

    it('should export universe as JSON', () => {
      cy.intercept('POST', '/api/universes/1/export', {
        statusCode: 200,
        body: {
          export_id: 'test-export',
          status: 'processing',
        },
      }).as('startExport');

      cy.intercept('GET', '/api/export/test-export/status', {
        statusCode: 200,
        body: {
          status: 'completed',
          download_url: 'https://example.com/exports/universe.json',
        },
      }).as('exportStatus');

      // Select JSON format
      cy.get('[data-testid="format-json"]').click();

      // Configure export options
      cy.get('[data-testid="export-physics"]').check();
      cy.get('[data-testid="export-audio"]').check();

      // Start export
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@startExport');

      // Check progress
      cy.get('[data-testid="export-progress"]').should('be.visible');
      cy.wait('@exportStatus');

      // Verify download link
      cy.get('[data-testid="download-export"]').should(
        'have.attr',
        'href',
        'https://example.com/exports/universe.json'
      );
    });

    it('should export audio as WAV', () => {
      cy.intercept('POST', '/api/universes/1/export-audio', {
        statusCode: 200,
        body: {
          export_id: 'test-audio-export',
          status: 'processing',
        },
      }).as('startAudioExport');

      cy.intercept('GET', '/api/export/test-audio-export/status', {
        statusCode: 200,
        body: {
          status: 'completed',
          download_url: 'https://example.com/exports/audio.wav',
        },
      }).as('audioExportStatus');

      // Select WAV format
      cy.get('[data-testid="format-wav"]').click();

      // Configure audio export options
      cy.get('[data-testid="audio-quality"]').select('high');
      cy.get('[data-testid="audio-normalize"]').check();

      // Start export
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@startAudioExport');

      // Check progress
      cy.get('[data-testid="export-progress"]').should('be.visible');
      cy.wait('@audioExportStatus');

      // Verify download link
      cy.get('[data-testid="download-export"]').should(
        'have.attr',
        'href',
        'https://example.com/exports/audio.wav'
      );
    });
  });

  describe('Import', () => {
    it('should import universe from JSON', () => {
      const testFile = {
        name: 'universe.json',
        type: 'application/json',
        content: JSON.stringify({
          name: 'Imported Universe',
          description: 'An imported universe',
          physics_params: {
            particle_count: 500,
            gravity: 9.81,
          },
          audio_params: {
            sample_rate: 44100,
            channels: 2,
          },
        }),
      };

      cy.intercept('POST', '/api/universes/import', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'Imported Universe',
          description: 'An imported universe',
        },
      }).as('importUniverse');

      // Upload file
      cy.get('[data-testid="file-upload"]').attachFile(testFile);

      // Configure import options
      cy.get('[data-testid="import-physics"]').check();
      cy.get('[data-testid="import-audio"]').check();

      // Start import
      cy.get('[data-testid="start-import"]').click();
      cy.wait('@importUniverse');

      // Verify success message
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Universe imported successfully'
      );

      // Verify redirect to new universe
      cy.url().should('include', '/universes/2');
    });

    it('should import audio file', () => {
      const testAudioFile = {
        name: 'audio.wav',
        type: 'audio/wav',
      };

      cy.intercept('POST', '/api/universes/1/import-audio', {
        statusCode: 200,
        body: {
          message: 'Audio imported successfully',
        },
      }).as('importAudio');

      // Upload audio file
      cy.get('[data-testid="audio-upload"]').attachFile(testAudioFile);

      // Configure audio import options
      cy.get('[data-testid="audio-normalize"]').check();
      cy.get('[data-testid="audio-loop"]').check();

      // Start import
      cy.get('[data-testid="start-audio-import"]').click();
      cy.wait('@importAudio');

      // Verify success message
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Audio imported successfully'
      );
    });

    it('should handle batch import', () => {
      const testFiles = [
        {
          name: 'universe1.json',
          type: 'application/json',
          content: JSON.stringify({ name: 'Universe 1' }),
        },
        {
          name: 'universe2.json',
          type: 'application/json',
          content: JSON.stringify({ name: 'Universe 2' }),
        },
      ];

      cy.intercept('POST', '/api/universes/batch-import', {
        statusCode: 200,
        body: {
          imported: [
            { id: 2, name: 'Universe 1' },
            { id: 3, name: 'Universe 2' },
          ],
          failed: [],
        },
      }).as('batchImport');

      // Upload multiple files
      cy.get('[data-testid="batch-upload"]').attachFile(testFiles);

      // Start batch import
      cy.get('[data-testid="start-batch-import"]').click();
      cy.wait('@batchImport');

      // Verify success message
      cy.get('[data-testid="success-message"]').should(
        'contain',
        '2 universes imported successfully'
      );
    });
  });

  describe('Templates', () => {
    it('should export as template', () => {
      cy.intercept('POST', '/api/universes/1/export-template', {
        statusCode: 200,
        body: {
          template_id: 'test-template',
          name: 'Test Template',
          description: 'A test template',
        },
      }).as('exportTemplate');

      // Configure template options
      cy.get('[data-testid="template-name"]').type('Test Template');
      cy.get('[data-testid="template-description"]').type('A test template');
      cy.get('[data-testid="template-category"]').select('physics');

      // Start template export
      cy.get('[data-testid="export-template"]').click();
      cy.wait('@exportTemplate');

      // Verify success message
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Template created successfully'
      );
    });

    it('should import from template', () => {
      cy.intercept('GET', '/api/templates', {
        statusCode: 200,
        body: {
          templates: [
            {
              id: 'test-template',
              name: 'Test Template',
              description: 'A test template',
              category: 'physics',
              preview_url: 'https://example.com/preview.jpg',
            },
          ],
        },
      }).as('getTemplates');

      cy.intercept('POST', '/api/templates/test-template/import', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'New Universe from Template',
        },
      }).as('importTemplate');

      // View templates
      cy.get('[data-testid="view-templates"]').click();
      cy.wait('@getTemplates');

      // Select template
      cy.get('[data-testid="template-test-template"]').click();

      // Configure template import
      cy.get('[data-testid="template-universe-name"]').type(
        'New Universe from Template'
      );

      // Start import
      cy.get('[data-testid="import-template"]').click();
      cy.wait('@importTemplate');

      // Verify success message
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Universe created from template'
      );

      // Verify redirect to new universe
      cy.url().should('include', '/universes/2');
    });
  });

  describe('Error Handling', () => {
    it('should handle export errors', () => {
      cy.intercept('POST', '/api/universes/1/export', {
        statusCode: 500,
        body: {
          error: 'Export failed',
        },
      }).as('exportError');

      cy.get('[data-testid="format-json"]').click();
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@exportError');

      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Export failed'
      );
    });

    it('should handle import validation errors', () => {
      const invalidFile = {
        name: 'invalid.json',
        type: 'application/json',
        content: 'invalid json content',
      };

      cy.intercept('POST', '/api/universes/import', {
        statusCode: 400,
        body: {
          error: 'Invalid file format',
          details: ['JSON parsing failed'],
        },
      }).as('importError');

      cy.get('[data-testid="file-upload"]').attachFile(invalidFile);
      cy.get('[data-testid="start-import"]').click();
      cy.wait('@importError');

      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Invalid file format'
      );
      cy.get('[data-testid="error-details"]').should(
        'contain',
        'JSON parsing failed'
      );
    });

    it('should handle unsupported formats', () => {
      const unsupportedFile = {
        name: 'file.xyz',
        type: 'application/octet-stream',
      };

      cy.get('[data-testid="file-upload"]').attachFile(unsupportedFile);

      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Unsupported file format'
      );
    });
  });
});
