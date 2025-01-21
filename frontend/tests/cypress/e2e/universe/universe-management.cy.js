describe('Universe Management', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock universe list
    cy.intercept('GET', '/api/universes', {
      statusCode: 200,
      body: {
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            created_at: '2024-01-20T12:00:00Z',
            updated_at: '2024-01-20T12:00:00Z',
            owner_id: 1,
            physics_params: {
              gravity: 9.8,
              friction: 0.5,
              particles: 1000,
              boundaries: {
                x: [-100, 100],
                y: [-100, 100],
                z: [-100, 100],
              },
            },
            audio_params: {
              harmony: 0.7,
              rhythm: 0.5,
              tempo: 120,
              scale: 'major',
              root_note: 'C4',
              effects: ['reverb', 'delay'],
            },
            shared_with: [
              {
                user_id: 2,
                username: 'collaborator1',
                role: 'editor',
              },
            ],
            version: 1,
          },
        ],
      },
    }).as('getUniverses');

    // Mock universe templates
    cy.intercept('GET', '/api/universes/templates', {
      statusCode: 200,
      body: {
        templates: [
          {
            id: 1,
            name: 'Empty Universe',
            description: 'Start from scratch',
            preview_url: 'https://example.com/previews/empty.png',
            physics_params: {
              gravity: 9.8,
              friction: 0.5,
              particles: 0,
            },
            audio_params: {
              harmony: 0.5,
              rhythm: 0.5,
              tempo: 120,
            },
          },
          {
            id: 2,
            name: 'Particle System',
            description: 'Pre-configured particle system',
            preview_url: 'https://example.com/previews/particles.png',
            physics_params: {
              gravity: 0,
              friction: 0.1,
              particles: 1000,
            },
            audio_params: {
              harmony: 0.8,
              rhythm: 0.7,
              tempo: 140,
            },
          },
        ],
      },
    }).as('getTemplates');

    // Mock single universe
    cy.intercept('GET', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
        physics_params: {
          gravity: 9.8,
          friction: 0.5,
          particles: 1000,
        },
        audio_params: {
          harmony: 0.7,
          rhythm: 0.5,
          tempo: 120,
        },
        version: 1,
      },
    }).as('getUniverse');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universes');
    cy.wait('@getUniverses');
  });

  it('should display universe list', () => {
    cy.get('[data-testid="universe-list"]').should('be.visible');
    cy.get('[data-testid="universe-1"]').within(() => {
      cy.get('[data-testid="universe-name"]').should(
        'contain',
        'Test Universe'
      );
      cy.get('[data-testid="universe-description"]').should(
        'contain',
        'A test universe'
      );
      cy.get('[data-testid="last-updated"]').should('contain', '2024-01-20');
      cy.get('[data-testid="collaborator-count"]').should('contain', '1');
    });
  });

  it('should create new universe from template', () => {
    cy.intercept('POST', '/api/universes', {
      statusCode: 201,
      body: {
        id: 2,
        name: 'New Universe',
        description: 'Created from template',
        physics_params: {
          gravity: 9.8,
          friction: 0.5,
          particles: 0,
        },
        audio_params: {
          harmony: 0.5,
          rhythm: 0.5,
          tempo: 120,
        },
      },
    }).as('createUniverse');

    cy.get('[data-testid="create-universe"]').click();
    cy.get('[data-testid="template-1"]').click();
    cy.get('[data-testid="universe-name-input"]').type('New Universe');
    cy.get('[data-testid="universe-description-input"]').type(
      'Created from template'
    );
    cy.get('[data-testid="create-from-template"]').click();

    cy.wait('@createUniverse');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Universe created successfully'
    );
  });

  it('should edit universe details', () => {
    cy.intercept('PUT', '/api/universes/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Updated Universe',
        description: 'Updated description',
      },
    }).as('updateUniverse');

    cy.get('[data-testid="universe-1"]')
      .find('[data-testid="edit-universe"]')
      .click();
    cy.get('[data-testid="universe-name-input"]')
      .clear()
      .type('Updated Universe');
    cy.get('[data-testid="universe-description-input"]')
      .clear()
      .type('Updated description');
    cy.get('[data-testid="save-universe"]').click();

    cy.wait('@updateUniverse');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Universe updated successfully'
    );
  });

  it('should configure physics parameters', () => {
    cy.intercept('PUT', '/api/universes/1/physics', {
      statusCode: 200,
      body: {
        physics_params: {
          gravity: 5.0,
          friction: 0.3,
          particles: 2000,
          boundaries: {
            x: [-200, 200],
            y: [-200, 200],
            z: [-200, 200],
          },
        },
      },
    }).as('updatePhysics');

    cy.visit('/universes/1/settings');
    cy.wait('@getUniverse');

    cy.get('[data-testid="physics-tab"]').click();
    cy.get('[data-testid="gravity-input"]').clear().type('5.0');
    cy.get('[data-testid="friction-input"]').clear().type('0.3');
    cy.get('[data-testid="particles-input"]').clear().type('2000');
    cy.get('[data-testid="boundary-x-min"]').clear().type('-200');
    cy.get('[data-testid="boundary-x-max"]').clear().type('200');
    cy.get('[data-testid="save-physics"]').click();

    cy.wait('@updatePhysics');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Physics parameters updated'
    );
  });

  it('should configure audio parameters', () => {
    cy.intercept('PUT', '/api/universes/1/audio', {
      statusCode: 200,
      body: {
        audio_params: {
          harmony: 0.8,
          rhythm: 0.6,
          tempo: 140,
          scale: 'minor',
          root_note: 'A4',
          effects: ['chorus', 'reverb'],
        },
      },
    }).as('updateAudio');

    cy.visit('/universes/1/settings');
    cy.wait('@getUniverse');

    cy.get('[data-testid="audio-tab"]').click();
    cy.get('[data-testid="harmony-input"]').clear().type('0.8');
    cy.get('[data-testid="rhythm-input"]').clear().type('0.6');
    cy.get('[data-testid="tempo-input"]').clear().type('140');
    cy.get('[data-testid="scale-select"]').select('minor');
    cy.get('[data-testid="root-note-select"]').select('A4');
    cy.get('[data-testid="effects-select"]').select(['chorus', 'reverb']);
    cy.get('[data-testid="save-audio"]').click();

    cy.wait('@updateAudio');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Audio parameters updated'
    );
  });

  it('should handle universe sharing', () => {
    cy.intercept('POST', '/api/universes/1/share', {
      statusCode: 200,
      body: {
        message: 'Universe shared successfully',
        shared_with: [
          {
            user_id: 3,
            username: 'newcollaborator',
            role: 'viewer',
          },
        ],
      },
    }).as('shareUniverse');

    cy.visit('/universes/1/settings');
    cy.wait('@getUniverse');

    cy.get('[data-testid="sharing-tab"]').click();
    cy.get('[data-testid="share-username"]').type('newcollaborator');
    cy.get('[data-testid="share-role"]').select('viewer');
    cy.get('[data-testid="share-universe"]').click();

    cy.wait('@shareUniverse');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Universe shared successfully'
    );
  });

  it('should handle version control', () => {
    // Mock version list
    cy.intercept('GET', '/api/universes/1/versions', {
      statusCode: 200,
      body: {
        versions: [
          {
            version: 1,
            created_at: '2024-01-20T12:00:00Z',
            changes: ['Initial version'],
          },
          {
            version: 2,
            created_at: '2024-01-20T13:00:00Z',
            changes: ['Updated physics parameters'],
          },
        ],
      },
    }).as('getVersions');

    // Mock version creation
    cy.intercept('POST', '/api/universes/1/versions', {
      statusCode: 201,
      body: {
        version: 3,
        created_at: '2024-01-20T14:00:00Z',
        changes: ['New version created'],
      },
    }).as('createVersion');

    // Mock version restore
    cy.intercept('POST', '/api/universes/1/versions/2/restore', {
      statusCode: 200,
      body: {
        message: 'Version 2 restored successfully',
      },
    }).as('restoreVersion');

    cy.visit('/universes/1/versions');
    cy.wait(['@getUniverse', '@getVersions']);

    // Create new version
    cy.get('[data-testid="create-version"]').click();
    cy.get('[data-testid="version-notes"]').type('New version created');
    cy.get('[data-testid="save-version"]').click();
    cy.wait('@createVersion');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Version created successfully'
    );

    // View version history
    cy.get('[data-testid="version-2"]').within(() => {
      cy.get('[data-testid="version-number"]').should('contain', '2');
      cy.get('[data-testid="version-date"]').should('contain', '2024-01-20');
      cy.get('[data-testid="version-changes"]').should(
        'contain',
        'Updated physics parameters'
      );
    });

    // Restore previous version
    cy.get('[data-testid="version-2"]')
      .find('[data-testid="restore-version"]')
      .click();
    cy.get('[data-testid="confirm-restore"]').click();
    cy.wait('@restoreVersion');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Version 2 restored successfully'
    );
  });

  it('should handle universe export/import', () => {
    // Mock export
    cy.intercept('GET', '/api/universes/1/export', {
      statusCode: 200,
      body: {
        url: 'https://example.com/exports/universe1.json',
      },
    }).as('exportUniverse');

    // Mock import
    cy.intercept('POST', '/api/universes/import', {
      statusCode: 201,
      body: {
        id: 3,
        name: 'Imported Universe',
        message: 'Universe imported successfully',
      },
    }).as('importUniverse');

    // Test export
    cy.visit('/universes/1/settings');
    cy.wait('@getUniverse');

    cy.get('[data-testid="export-tab"]').click();
    cy.get('[data-testid="export-format"]').select('json');
    cy.get('[data-testid="start-export"]').click();

    cy.wait('@exportUniverse');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Universe exported successfully'
    );
    cy.get('[data-testid="download-link"]')
      .should('have.attr', 'href')
      .and('include', 'universe1.json');

    // Test import
    cy.get('[data-testid="import-universe"]').click();
    cy.get('[data-testid="import-file"]').attachFile('universe.json');
    cy.get('[data-testid="start-import"]').click();

    cy.wait('@importUniverse');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Universe imported successfully'
    );
  });

  it('should handle universe templates', () => {
    // Mock template creation
    cy.intercept('POST', '/api/universes/templates', {
      statusCode: 201,
      body: {
        id: 3,
        name: 'Custom Template',
        description: 'Created during test',
        message: 'Template created successfully',
      },
    }).as('createTemplate');

    // Mock template update
    cy.intercept('PUT', '/api/universes/templates/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Updated Template',
        description: 'Updated during test',
        message: 'Template updated successfully',
      },
    }).as('updateTemplate');

    // Mock template deletion
    cy.intercept('DELETE', '/api/universes/templates/1', {
      statusCode: 200,
      body: {
        message: 'Template deleted successfully',
      },
    }).as('deleteTemplate');

    cy.visit('/universes/templates');
    cy.wait('@getTemplates');

    // Create template
    cy.get('[data-testid="create-template"]').click();
    cy.get('[data-testid="template-name"]').type('Custom Template');
    cy.get('[data-testid="template-description"]').type('Created during test');
    cy.get('[data-testid="save-template"]').click();

    cy.wait('@createTemplate');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Template created successfully'
    );

    // Edit template
    cy.get('[data-testid="template-1"]')
      .find('[data-testid="edit-template"]')
      .click();
    cy.get('[data-testid="template-name"]').clear().type('Updated Template');
    cy.get('[data-testid="template-description"]')
      .clear()
      .type('Updated during test');
    cy.get('[data-testid="save-template"]').click();

    cy.wait('@updateTemplate');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Template updated successfully'
    );

    // Delete template
    cy.get('[data-testid="template-1"]')
      .find('[data-testid="delete-template"]')
      .click();
    cy.get('[data-testid="confirm-delete"]').click();

    cy.wait('@deleteTemplate');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Template deleted successfully'
    );
  });

  it('should handle error states', () => {
    // Test creation error
    cy.intercept('POST', '/api/universes', {
      statusCode: 500,
      body: {
        error: 'Failed to create universe',
      },
    }).as('createError');

    cy.get('[data-testid="create-universe"]').click();
    cy.get('[data-testid="template-1"]').click();
    cy.get('[data-testid="universe-name-input"]').type('Error Test');
    cy.get('[data-testid="create-from-template"]').click();

    cy.wait('@createError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Failed to create universe'
    );

    // Test import error
    cy.intercept('POST', '/api/universes/import', {
      statusCode: 400,
      body: {
        error: 'Invalid file format',
      },
    }).as('importError');

    cy.get('[data-testid="import-universe"]').click();
    cy.get('[data-testid="import-file"]').attachFile('invalid.txt');
    cy.get('[data-testid="start-import"]').click();

    cy.wait('@importError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Invalid file format'
    );

    // Test version control error
    cy.intercept('POST', '/api/universes/1/versions/2/restore', {
      statusCode: 404,
      body: {
        error: 'Version not found',
      },
    }).as('versionError');

    cy.visit('/universes/1/versions');
    cy.wait(['@getUniverse', '@getVersions']);

    cy.get('[data-testid="version-2"]')
      .find('[data-testid="restore-version"]')
      .click();
    cy.get('[data-testid="confirm-restore"]').click();

    cy.wait('@versionError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Version not found'
    );
  });
});
