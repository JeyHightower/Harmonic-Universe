describe('Storyboard Features', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock storyboard list
    cy.intercept('GET', '/api/storyboards', {
      statusCode: 200,
      body: {
        storyboards: [
          {
            id: 1,
            title: 'Test Storyboard',
            description: 'A test storyboard',
            created_at: '2024-01-20T12:00:00Z',
            updated_at: '2024-01-20T12:00:00Z',
            owner_id: 1,
            scenes: [
              {
                id: 1,
                title: 'Opening Scene',
                description: 'The beginning',
                physics_state: {
                  gravity: 9.8,
                  friction: 0.5,
                  particles: 1000,
                },
                audio_state: {
                  harmony: 0.7,
                  rhythm: 0.5,
                  effects: ['reverb'],
                },
                duration: 10,
                order: 1,
              },
              {
                id: 2,
                title: 'Middle Scene',
                description: 'The climax',
                physics_state: {
                  gravity: 5.0,
                  friction: 0.3,
                  particles: 2000,
                },
                audio_state: {
                  harmony: 0.8,
                  rhythm: 0.7,
                  effects: ['delay'],
                },
                duration: 15,
                order: 2,
              },
            ],
            collaborators: [
              {
                id: 2,
                username: 'collaborator1',
                role: 'editor',
              },
            ],
          },
        ],
      },
    }).as('getStoryboards');

    // Mock single storyboard
    cy.intercept('GET', '/api/storyboards/1', {
      statusCode: 200,
      body: {
        id: 1,
        title: 'Test Storyboard',
        description: 'A test storyboard',
        scenes: [
          {
            id: 1,
            title: 'Opening Scene',
            description: 'The beginning',
            physics_state: {
              gravity: 9.8,
              friction: 0.5,
              particles: 1000,
            },
            audio_state: {
              harmony: 0.7,
              rhythm: 0.5,
              effects: ['reverb'],
            },
            duration: 10,
            order: 1,
          },
        ],
      },
    }).as('getStoryboard');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/storyboards');
    cy.wait('@getStoryboards');
  });

  it('should display storyboard list', () => {
    cy.get('[data-testid="storyboard-list"]').should('be.visible');
    cy.get('[data-testid="storyboard-1"]').within(() => {
      cy.get('[data-testid="storyboard-title"]').should(
        'contain',
        'Test Storyboard'
      );
      cy.get('[data-testid="storyboard-description"]').should(
        'contain',
        'A test storyboard'
      );
      cy.get('[data-testid="scene-count"]').should('contain', '2');
      cy.get('[data-testid="last-updated"]').should('contain', '2024-01-20');
    });
  });

  it('should create new storyboard', () => {
    cy.intercept('POST', '/api/storyboards', {
      statusCode: 201,
      body: {
        id: 2,
        title: 'New Storyboard',
        description: 'Created during test',
      },
    }).as('createStoryboard');

    cy.get('[data-testid="create-storyboard"]').click();
    cy.get('[data-testid="storyboard-title-input"]').type('New Storyboard');
    cy.get('[data-testid="storyboard-description-input"]').type(
      'Created during test'
    );
    cy.get('[data-testid="save-storyboard"]').click();

    cy.wait('@createStoryboard');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Storyboard created successfully'
    );
  });

  it('should edit existing storyboard', () => {
    cy.intercept('PUT', '/api/storyboards/1', {
      statusCode: 200,
      body: {
        id: 1,
        title: 'Updated Storyboard',
        description: 'Updated description',
      },
    }).as('updateStoryboard');

    cy.get('[data-testid="storyboard-1"]')
      .find('[data-testid="edit-storyboard"]')
      .click();
    cy.get('[data-testid="storyboard-title-input"]')
      .clear()
      .type('Updated Storyboard');
    cy.get('[data-testid="storyboard-description-input"]')
      .clear()
      .type('Updated description');
    cy.get('[data-testid="save-storyboard"]').click();

    cy.wait('@updateStoryboard');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Storyboard updated successfully'
    );
  });

  it('should add scene to storyboard', () => {
    cy.intercept('POST', '/api/storyboards/1/scenes', {
      statusCode: 201,
      body: {
        id: 3,
        title: 'New Scene',
        description: 'Added during test',
        physics_state: {
          gravity: 9.8,
          friction: 0.5,
          particles: 1000,
        },
        audio_state: {
          harmony: 0.7,
          rhythm: 0.5,
          effects: ['reverb'],
        },
        duration: 10,
        order: 3,
      },
    }).as('createScene');

    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    cy.get('[data-testid="add-scene"]').click();
    cy.get('[data-testid="scene-title-input"]').type('New Scene');
    cy.get('[data-testid="scene-description-input"]').type('Added during test');

    // Configure physics state
    cy.get('[data-testid="physics-gravity"]').clear().type('9.8');
    cy.get('[data-testid="physics-friction"]').clear().type('0.5');
    cy.get('[data-testid="physics-particles"]').clear().type('1000');

    // Configure audio state
    cy.get('[data-testid="audio-harmony"]').clear().type('0.7');
    cy.get('[data-testid="audio-rhythm"]').clear().type('0.5');
    cy.get('[data-testid="audio-effects"]').select(['reverb']);

    cy.get('[data-testid="scene-duration"]').clear().type('10');
    cy.get('[data-testid="save-scene"]').click();

    cy.wait('@createScene');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Scene added successfully'
    );
  });

  it('should reorder scenes', () => {
    cy.intercept('PUT', '/api/storyboards/1/scenes/reorder', {
      statusCode: 200,
      body: {
        message: 'Scenes reordered successfully',
      },
    }).as('reorderScenes');

    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    // Drag second scene above first scene
    cy.get('[data-testid="scene-2"]').drag('[data-testid="scene-1"]', {
      force: true,
    });

    cy.wait('@reorderScenes');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Scenes reordered successfully'
    );

    // Verify new order
    cy.get('[data-testid="scene-list"]')
      .children()
      .first()
      .should('have.attr', 'data-testid', 'scene-2');
  });

  it('should delete scene', () => {
    cy.intercept('DELETE', '/api/storyboards/1/scenes/1', {
      statusCode: 200,
      body: {
        message: 'Scene deleted successfully',
      },
    }).as('deleteScene');

    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    cy.get('[data-testid="scene-1"]')
      .find('[data-testid="delete-scene"]')
      .click();
    cy.get('[data-testid="confirm-delete"]').click();

    cy.wait('@deleteScene');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Scene deleted successfully'
    );
    cy.get('[data-testid="scene-1"]').should('not.exist');
  });

  it('should delete storyboard', () => {
    cy.intercept('DELETE', '/api/storyboards/1', {
      statusCode: 200,
      body: {
        message: 'Storyboard deleted successfully',
      },
    }).as('deleteStoryboard');

    cy.get('[data-testid="storyboard-1"]')
      .find('[data-testid="delete-storyboard"]')
      .click();
    cy.get('[data-testid="confirm-delete"]').click();

    cy.wait('@deleteStoryboard');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Storyboard deleted successfully'
    );
    cy.get('[data-testid="storyboard-1"]').should('not.exist');
  });

  it('should handle collaboration', () => {
    cy.intercept('POST', '/api/storyboards/1/collaborators', {
      statusCode: 200,
      body: {
        message: 'Collaborator added successfully',
        collaborator: {
          id: 3,
          username: 'newcollaborator',
          role: 'viewer',
        },
      },
    }).as('addCollaborator');

    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    cy.get('[data-testid="share-storyboard"]').click();
    cy.get('[data-testid="collaborator-username"]').type('newcollaborator');
    cy.get('[data-testid="collaborator-role"]').select('viewer');
    cy.get('[data-testid="add-collaborator"]').click();

    cy.wait('@addCollaborator');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Collaborator added successfully'
    );
  });

  it('should handle real-time updates', () => {
    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    // Simulate WebSocket message for scene update
    cy.window().then(win => {
      win.dispatchEvent(
        new CustomEvent('storyboard-update', {
          detail: {
            type: 'scene-update',
            sceneId: 1,
            changes: {
              title: 'Updated Scene Title',
            },
          },
        })
      );
    });

    cy.get('[data-testid="scene-1"]')
      .find('[data-testid="scene-title"]')
      .should('contain', 'Updated Scene Title');
  });

  it('should export storyboard', () => {
    cy.intercept('GET', '/api/storyboards/1/export', {
      statusCode: 200,
      body: {
        url: 'https://example.com/exports/storyboard1.json',
      },
    }).as('exportStoryboard');

    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    cy.get('[data-testid="export-storyboard"]').click();
    cy.get('[data-testid="export-format"]').select('json');
    cy.get('[data-testid="start-export"]').click();

    cy.wait('@exportStoryboard');
    cy.get('[data-testid="success-message"]').should(
      'contain',
      'Storyboard exported successfully'
    );
    cy.get('[data-testid="download-link"]')
      .should('have.attr', 'href')
      .and('include', 'storyboard1.json');
  });

  it('should handle error states', () => {
    // Test creation error
    cy.intercept('POST', '/api/storyboards', {
      statusCode: 500,
      body: {
        error: 'Failed to create storyboard',
      },
    }).as('createError');

    cy.get('[data-testid="create-storyboard"]').click();
    cy.get('[data-testid="storyboard-title-input"]').type('Error Test');
    cy.get('[data-testid="save-storyboard"]').click();

    cy.wait('@createError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Failed to create storyboard'
    );

    // Test scene addition error
    cy.intercept('POST', '/api/storyboards/1/scenes', {
      statusCode: 500,
      body: {
        error: 'Failed to add scene',
      },
    }).as('sceneError');

    cy.visit('/storyboards/1');
    cy.wait('@getStoryboard');

    cy.get('[data-testid="add-scene"]').click();
    cy.get('[data-testid="scene-title-input"]').type('Error Scene');
    cy.get('[data-testid="save-scene"]').click();

    cy.wait('@sceneError');
    cy.get('[data-testid="error-message"]').should(
      'contain',
      'Failed to add scene'
    );

    // Test collaboration error
    cy.intercept('POST', '/api/storyboards/1/collaborators', {
      statusCode: 404,
      body: {
        error: 'User not found',
      },
    }).as('collaboratorError');

    cy.get('[data-testid="share-storyboard"]').click();
    cy.get('[data-testid="collaborator-username"]').type('nonexistentuser');
    cy.get('[data-testid="add-collaborator"]').click();

    cy.wait('@collaboratorError');
    cy.get('[data-testid="error-message"]').should('contain', 'User not found');
  });
});
