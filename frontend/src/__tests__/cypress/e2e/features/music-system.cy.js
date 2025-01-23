describe('Music System Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock initial composition data
    cy.intercept('GET', '/api/compositions/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Composition',
        tracks: [
          {
            id: 1,
            name: 'Piano Track',
            instrument: 'piano',
            notes: [],
            volume: 1.0,
            muted: false,
          },
        ],
        tempo: 120,
        timeSignature: '4/4',
        key: 'C',
        version: 1,
      },
    }).as('getComposition');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/compositions/1');
    cy.wait('@getComposition');
  });

  describe('Composition Management', () => {
    it('should create new composition', () => {
      cy.intercept('POST', '/api/compositions', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'New Composition',
          tracks: [],
          tempo: 120,
          timeSignature: '4/4',
          key: 'C',
        },
      }).as('createComposition');

      cy.get('[data-testid="new-composition"]').click();
      cy.get('[data-testid="composition-name"]').type('New Composition');
      cy.get('[data-testid="create-composition"]').click();
      cy.wait('@createComposition');

      cy.get('[data-testid="composition-title"]').should(
        'contain',
        'New Composition'
      );
    });

    it('should edit composition settings', () => {
      cy.intercept('PUT', '/api/compositions/1', {
        statusCode: 200,
        body: {
          tempo: 140,
          timeSignature: '3/4',
          key: 'G',
        },
      }).as('updateSettings');

      cy.get('[data-testid="composition-settings"]').click();
      cy.get('[data-testid="tempo-input"]').clear().type('140');
      cy.get('[data-testid="time-signature"]').select('3/4');
      cy.get('[data-testid="key-signature"]').select('G');
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateSettings');

      cy.get('[data-testid="tempo-display"]').should('contain', '140');
    });
  });

  describe('Track Management', () => {
    it('should add new track', () => {
      cy.intercept('POST', '/api/compositions/1/tracks', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'Guitar Track',
          instrument: 'guitar',
          notes: [],
          volume: 1.0,
          muted: false,
        },
      }).as('addTrack');

      cy.get('[data-testid="add-track"]').click();
      cy.get('[data-testid="track-name"]').type('Guitar Track');
      cy.get('[data-testid="track-instrument"]').select('guitar');
      cy.get('[data-testid="create-track"]').click();
      cy.wait('@addTrack');

      cy.get('[data-testid="track-2"]').should('contain', 'Guitar Track');
    });

    it('should edit track settings', () => {
      cy.intercept('PUT', '/api/compositions/1/tracks/1', {
        statusCode: 200,
        body: {
          volume: 0.8,
          muted: true,
        },
      }).as('updateTrack');

      cy.get('[data-testid="track-1-settings"]').click();
      cy.get('[data-testid="track-volume"]')
        .invoke('val', 0.8)
        .trigger('change');
      cy.get('[data-testid="track-mute"]').click();
      cy.get('[data-testid="save-track"]').click();
      cy.wait('@updateTrack');

      cy.get('[data-testid="track-1"]').should('have.class', 'muted');
    });
  });

  describe('Note Editing', () => {
    it('should add and edit notes', () => {
      cy.intercept('PUT', '/api/compositions/1/tracks/1/notes', {
        statusCode: 200,
        body: {
          notes: [{ pitch: 'C4', time: 0, duration: 1, velocity: 100 }],
        },
      }).as('updateNotes');

      cy.get('[data-testid="piano-roll"]').click(100, 100);
      cy.get('[data-testid="note-editor"]').should('be.visible');
      cy.get('[data-testid="note-duration"]').type('1');
      cy.get('[data-testid="note-velocity"]').type('100');
      cy.get('[data-testid="save-note"]').click();
      cy.wait('@updateNotes');

      cy.get('[data-testid="piano-roll-note"]').should('exist');
    });

    it('should delete notes', () => {
      cy.intercept('PUT', '/api/compositions/1/tracks/1/notes', {
        statusCode: 200,
        body: { notes: [] },
      }).as('deleteNotes');

      cy.get('[data-testid="piano-roll-note"]').click();
      cy.get('[data-testid="delete-note"]').click();
      cy.wait('@deleteNotes');

      cy.get('[data-testid="piano-roll-note"]').should('not.exist');
    });
  });

  describe('Playback Controls', () => {
    it('should control playback', () => {
      // Play
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="transport-bar"]').should('have.class', 'playing');

      // Pause
      cy.get('[data-testid="pause-button"]').click();
      cy.get('[data-testid="transport-bar"]').should(
        'not.have.class',
        'playing'
      );

      // Stop
      cy.get('[data-testid="stop-button"]').click();
      cy.get('[data-testid="playhead"]').should('have.css', 'left', '0px');
    });

    it('should handle loop points', () => {
      cy.get('[data-testid="loop-enable"]').click();
      cy.get('[data-testid="loop-start"]').type('1');
      cy.get('[data-testid="loop-end"]').type('5');

      cy.get('[data-testid="transport-bar"]').should(
        'have.class',
        'loop-enabled'
      );
    });
  });

  describe('Version Control', () => {
    it('should handle version history', () => {
      cy.intercept('GET', '/api/compositions/1/versions', {
        statusCode: 200,
        body: {
          versions: [
            {
              id: 2,
              timestamp: new Date().toISOString(),
              changes: 'Updated notes',
            },
            {
              id: 1,
              timestamp: new Date().toISOString(),
              changes: 'Initial version',
            },
          ],
        },
      }).as('getVersions');

      cy.get('[data-testid="version-history"]').click();
      cy.wait('@getVersions');

      cy.get('[data-testid="version-list"]').should('contain', 'Updated notes');
    });

    it('should restore previous version', () => {
      cy.intercept('POST', '/api/compositions/1/restore', {
        statusCode: 200,
        body: {
          version: 1,
          status: 'restored',
        },
      }).as('restoreVersion');

      cy.get('[data-testid="version-history"]').click();
      cy.get('[data-testid="restore-version-1"]').click();
      cy.wait('@restoreVersion');

      cy.get('[data-testid="version-restored"]').should('be.visible');
    });
  });

  describe('Export and Sharing', () => {
    it('should export composition', () => {
      cy.intercept('POST', '/api/compositions/1/export', {
        statusCode: 200,
        body: {
          url: 'https://example.com/export.mid',
          format: 'midi',
        },
      }).as('exportComposition');

      cy.get('[data-testid="export-composition"]').click();
      cy.get('[data-testid="export-format"]').select('midi');
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@exportComposition');

      cy.get('[data-testid="download-export"]')
        .should('have.attr', 'href')
        .and('include', 'export.mid');
    });

    it('should share composition', () => {
      cy.intercept('POST', '/api/compositions/1/share', {
        statusCode: 200,
        body: {
          shareUrl: 'https://example.com/share/abc123',
          accessLevel: 'view',
        },
      }).as('shareComposition');

      cy.get('[data-testid="share-composition"]').click();
      cy.get('[data-testid="share-access-level"]').select('view');
      cy.get('[data-testid="generate-share-link"]').click();
      cy.wait('@shareComposition');

      cy.get('[data-testid="share-url"]')
        .should('have.value')
        .and('include', 'share/abc123');
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors', () => {
      cy.intercept('PUT', '/api/compositions/1', {
        statusCode: 500,
        body: {
          error: 'Failed to save composition',
        },
      }).as('saveError');

      cy.get('[data-testid="composition-settings"]').click();
      cy.get('[data-testid="tempo-input"]').clear().type('140');
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@saveError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to save composition');
    });

    it('should handle playback errors', () => {
      // Mock playback error
      cy.window().then(win => {
        win.dispatchEvent(
          new CustomEvent('playbackError', {
            detail: { message: 'Audio context failed to start' },
          })
        );
      });

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Audio context failed to start');
    });
  });
});
