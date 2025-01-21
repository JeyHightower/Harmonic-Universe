describe('Music Composition Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock composition data
    cy.intercept('GET', '/api/compositions/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Composition',
        bpm: 120,
        timeSignature: '4/4',
        tracks: [
          {
            id: 1,
            name: 'Melody',
            type: 'synthesizer',
            instrument: 'sine',
            notes: [
              {
                pitch: 'C4',
                startTime: 0,
                duration: 1,
                velocity: 0.8,
              },
            ],
            effects: [],
            volume: 0.8,
            pan: 0,
          },
        ],
      },
    }).as('getComposition');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/composition/1');
    cy.wait('@getComposition');
  });

  describe('Track Management', () => {
    it('should create and configure tracks', () => {
      // Mock track creation
      cy.intercept('POST', '/api/compositions/1/tracks', {
        statusCode: 201,
        body: {
          id: 2,
          name: 'Bass',
          type: 'synthesizer',
          instrument: 'square',
          notes: [],
          effects: [],
          volume: 1,
          pan: 0,
        },
      }).as('createTrack');

      // Create track
      cy.get('[data-testid="add-track"]').click();
      cy.get('[data-testid="track-name"]').type('Bass');
      cy.get('[data-testid="track-type"]').select('synthesizer');
      cy.get('[data-testid="track-instrument"]').select('square');
      cy.get('[data-testid="save-track"]').click();
      cy.wait('@createTrack');

      // Verify track creation
      cy.get('[data-testid="track-2"]').should('exist');
      cy.get('[data-testid="track-2"]').should('contain', 'Bass');
    });

    it('should handle track controls', () => {
      // Mock volume update
      cy.intercept('PUT', '/api/compositions/1/tracks/1', {
        statusCode: 200,
        body: {
          volume: 0.5,
          pan: -0.3,
        },
      }).as('updateTrack');

      // Adjust track controls
      cy.get('[data-testid="track-1-volume"]')
        .invoke('val', 0.5)
        .trigger('change');
      cy.get('[data-testid="track-1-pan"]')
        .invoke('val', -0.3)
        .trigger('change');
      cy.wait('@updateTrack');

      // Verify control updates
      cy.get('[data-testid="track-1-volume"]').should('have.value', '0.5');
      cy.get('[data-testid="track-1-pan"]').should('have.value', '-0.3');
    });
  });

  describe('Note Editing', () => {
    it('should add and edit notes', () => {
      // Mock note creation
      cy.intercept('POST', '/api/compositions/1/tracks/1/notes', {
        statusCode: 201,
        body: {
          id: 1,
          pitch: 'E4',
          startTime: 2,
          duration: 0.5,
          velocity: 0.7,
        },
      }).as('createNote');

      // Add note
      cy.get('[data-testid="piano-roll"]').click(200, 100); // Click at position for E4
      cy.wait('@createNote');

      // Verify note creation
      cy.get('[data-testid="note-1"]')
        .should('exist')
        .and('have.attr', 'data-pitch', 'E4');

      // Mock note update
      cy.intercept('PUT', '/api/compositions/1/tracks/1/notes/1', {
        statusCode: 200,
        body: {
          duration: 1,
          velocity: 0.8,
        },
      }).as('updateNote');

      // Edit note
      cy.get('[data-testid="note-1"]').trigger('mousedown');
      cy.get('[data-testid="note-1"]').trigger('mousemove', { clientX: 250 });
      cy.get('[data-testid="note-1"]').trigger('mouseup');
      cy.wait('@updateNote');

      // Verify note update
      cy.get('[data-testid="note-1"]').should(
        'have.attr',
        'data-duration',
        '1'
      );
    });

    it('should handle note selection and deletion', () => {
      // Mock note deletion
      cy.intercept('DELETE', '/api/compositions/1/tracks/1/notes/1', {
        statusCode: 200,
      }).as('deleteNote');

      // Select and delete note
      cy.get('[data-testid="note-1"]').click();
      cy.get('body').type('{del}');
      cy.wait('@deleteNote');

      // Verify note deletion
      cy.get('[data-testid="note-1"]').should('not.exist');
    });
  });

  describe('Effects Processing', () => {
    it('should add and configure effects', () => {
      // Mock effect creation
      cy.intercept('POST', '/api/compositions/1/tracks/1/effects', {
        statusCode: 201,
        body: {
          id: 1,
          type: 'reverb',
          parameters: {
            roomSize: 0.7,
            dampening: 3000,
            wet: 0.3,
          },
        },
      }).as('createEffect');

      // Add effect
      cy.get('[data-testid="track-1-effects"]').click();
      cy.get('[data-testid="add-effect"]').click();
      cy.get('[data-testid="effect-type"]').select('reverb');
      cy.get('[data-testid="effect-room-size"]')
        .invoke('val', 0.7)
        .trigger('change');
      cy.get('[data-testid="effect-dampening"]').type('3000');
      cy.get('[data-testid="effect-wet"]').invoke('val', 0.3).trigger('change');
      cy.get('[data-testid="save-effect"]').click();
      cy.wait('@createEffect');

      // Verify effect creation
      cy.get('[data-testid="effect-1"]').should('exist');
    });

    it('should handle effect chain reordering', () => {
      // Mock effect reorder
      cy.intercept('PUT', '/api/compositions/1/tracks/1/effects/reorder', {
        statusCode: 200,
      }).as('reorderEffects');

      // Add second effect
      cy.intercept('POST', '/api/compositions/1/tracks/1/effects', {
        statusCode: 201,
        body: {
          id: 2,
          type: 'delay',
          parameters: {
            time: 0.3,
            feedback: 0.4,
            wet: 0.5,
          },
        },
      }).as('createSecondEffect');

      cy.get('[data-testid="add-effect"]').click();
      cy.get('[data-testid="effect-type"]').select('delay');
      cy.get('[data-testid="save-effect"]').click();
      cy.wait('@createSecondEffect');

      // Reorder effects
      cy.get('[data-testid="effect-2"]').drag('[data-testid="effect-1"]');
      cy.wait('@reorderEffects');

      // Verify new order
      cy.get('[data-testid="effects-chain"]').within(() => {
        cy.get('[data-testid="effect-2"]').should(
          'have.attr',
          'data-order',
          '0'
        );
        cy.get('[data-testid="effect-1"]').should(
          'have.attr',
          'data-order',
          '1'
        );
      });
    });
  });

  describe('Playback Controls', () => {
    it('should handle transport controls', () => {
      // Mock playback state
      cy.intercept('PUT', '/api/compositions/1/playback', {
        statusCode: 200,
        body: {
          isPlaying: true,
          currentTime: 0,
        },
      }).as('updatePlayback');

      // Test play/pause
      cy.get('[data-testid="play-button"]').click();
      cy.wait('@updatePlayback');
      cy.get('[data-testid="transport-controls"]').should(
        'have.class',
        'playing'
      );

      cy.get('[data-testid="pause-button"]').click();
      cy.get('[data-testid="transport-controls"]').should(
        'not.have.class',
        'playing'
      );

      // Test seek
      cy.get('[data-testid="timeline"]').click('center');
      cy.get('[data-testid="playhead"]')
        .should('have.attr', 'data-time')
        .and('not.eq', '0');
    });

    it('should handle tempo and time signature changes', () => {
      // Mock tempo update
      cy.intercept('PUT', '/api/compositions/1', {
        statusCode: 200,
        body: {
          bpm: 140,
          timeSignature: '3/4',
        },
      }).as('updateComposition');

      // Change tempo and time signature
      cy.get('[data-testid="tempo-input"]').clear().type('140');
      cy.get('[data-testid="time-signature"]').select('3/4');
      cy.wait('@updateComposition');

      // Verify updates
      cy.get('[data-testid="tempo-display"]').should('contain', '140');
      cy.get('[data-testid="time-signature-display"]').should('contain', '3/4');
    });
  });

  describe('Recording', () => {
    it('should handle MIDI recording', () => {
      // Mock recording state
      cy.intercept('POST', '/api/compositions/1/tracks/1/record', {
        statusCode: 200,
        body: {
          isRecording: true,
        },
      }).as('startRecording');

      // Start recording
      cy.get('[data-testid="record-button"]').click();
      cy.wait('@startRecording');
      cy.get('[data-testid="transport-controls"]').should(
        'have.class',
        'recording'
      );

      // Mock MIDI input
      cy.window().then(win => {
        win.dispatchEvent(
          new CustomEvent('midimessage', {
            detail: {
              data: [144, 60, 100], // Note on, C4, velocity 100
            },
          })
        );
      });

      // Stop recording
      cy.get('[data-testid="stop-button"]').click();
      cy.get('[data-testid="transport-controls"]').should(
        'not.have.class',
        'recording'
      );

      // Verify recorded notes
      cy.get('[data-testid="note"]').should('exist');
    });
  });

  describe('Export and Sharing', () => {
    it('should export composition', () => {
      // Mock export request
      cy.intercept('POST', '/api/compositions/1/export', {
        statusCode: 200,
        body: {
          url: 'https://example.com/exports/composition1.mid',
        },
      }).as('exportComposition');

      // Export composition
      cy.get('[data-testid="export-button"]').click();
      cy.get('[data-testid="export-format"]').select('midi');
      cy.get('[data-testid="start-export"]').click();
      cy.wait('@exportComposition');

      // Verify export completion
      cy.get('[data-testid="export-success"]').should('be.visible');
      cy.get('[data-testid="download-link"]')
        .should('have.attr', 'href')
        .and('include', 'composition1.mid');
    });
  });

  describe('Error Handling', () => {
    it('should handle playback errors', () => {
      // Mock playback error
      cy.intercept('PUT', '/api/compositions/1/playback', {
        statusCode: 500,
        body: {
          error: 'Audio context failed',
        },
      }).as('playbackError');

      // Trigger error
      cy.get('[data-testid="play-button"]').click();
      cy.wait('@playbackError');

      // Verify error handling
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Audio context failed');

      // Test recovery
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="error-message"]').should('not.exist');
    });
  });
});
