describe('Storyboard Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock storyboard data
    cy.intercept('GET', '/api/storyboards/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Storyboard',
        scenes: [
          {
            id: 1,
            name: 'Opening Scene',
            duration: 5000,
            elements: [
              {
                id: 1,
                type: 'shape',
                properties: {
                  type: 'circle',
                  x: 100,
                  y: 100,
                  radius: 50,
                  color: '#FF0000',
                },
                animations: [
                  {
                    property: 'radius',
                    from: 50,
                    to: 100,
                    duration: 2000,
                    easing: 'easeInOut',
                  },
                ],
              },
            ],
          },
        ],
        timeline: {
          duration: 10000,
          currentTime: 0,
          zoom: 1,
        },
        assets: [
          {
            id: 1,
            type: 'image',
            url: 'https://example.com/image.jpg',
            name: 'Background Image',
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

    cy.visit('/storyboard/1');
    cy.wait('@getStoryboard');
  });

  describe('Scene Management', () => {
    it('should create and edit scenes', () => {
      // Mock scene creation
      cy.intercept('POST', '/api/storyboards/1/scenes', {
        statusCode: 201,
        body: {
          id: 2,
          name: 'New Scene',
          duration: 3000,
          elements: [],
        },
      }).as('createScene');

      // Create new scene
      cy.get('[data-testid="add-scene"]').click();
      cy.get('[data-testid="scene-name"]').type('New Scene');
      cy.get('[data-testid="scene-duration"]').type('3000');
      cy.get('[data-testid="save-scene"]').click();
      cy.wait('@createScene');

      // Verify scene creation
      cy.get('[data-testid="scene-2"]').should('exist');
      cy.get('[data-testid="scene-2"]').should('contain', 'New Scene');

      // Mock scene update
      cy.intercept('PUT', '/api/storyboards/1/scenes/2', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'Updated Scene',
          duration: 4000,
        },
      }).as('updateScene');

      // Edit scene
      cy.get('[data-testid="scene-2"]').click();
      cy.get('[data-testid="edit-scene"]').click();
      cy.get('[data-testid="scene-name"]').clear().type('Updated Scene');
      cy.get('[data-testid="scene-duration"]').clear().type('4000');
      cy.get('[data-testid="save-scene"]').click();
      cy.wait('@updateScene');

      // Verify scene update
      cy.get('[data-testid="scene-2"]').should('contain', 'Updated Scene');
    });

    it('should handle scene transitions', () => {
      // Mock transition update
      cy.intercept('PUT', '/api/storyboards/1/scenes/1/transition', {
        statusCode: 200,
        body: {
          type: 'fade',
          duration: 1000,
        },
      }).as('updateTransition');

      // Configure transition
      cy.get('[data-testid="scene-1"]').click();
      cy.get('[data-testid="transition-settings"]').click();
      cy.get('[data-testid="transition-type"]').select('fade');
      cy.get('[data-testid="transition-duration"]').type('1000');
      cy.get('[data-testid="save-transition"]').click();
      cy.wait('@updateTransition');

      // Verify transition
      cy.get('[data-testid="scene-1"]')
        .find('[data-testid="transition-indicator"]')
        .should('contain', 'fade');
    });

    it('should reorder scenes', () => {
      // Mock scene reorder
      cy.intercept('PUT', '/api/storyboards/1/scenes/reorder', {
        statusCode: 200,
      }).as('reorderScenes');

      // Perform drag and drop
      cy.get('[data-testid="scene-1"]').drag('[data-testid="scene-2"]');
      cy.wait('@reorderScenes');

      // Verify new order
      cy.get('[data-testid="scene-list"]').within(() => {
        cy.get('[data-testid="scene-2"]').should(
          'have.attr',
          'data-order',
          '0'
        );
        cy.get('[data-testid="scene-1"]').should(
          'have.attr',
          'data-order',
          '1'
        );
      });
    });
  });

  describe('Timeline Controls', () => {
    it('should handle timeline playback', () => {
      // Test play controls
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="timeline-playhead"]')
        .should('have.class', 'playing')
        .and('have.attr', 'data-time')
        .and('not.eq', '0');

      // Test pause
      cy.get('[data-testid="pause-button"]').click();
      cy.get('[data-testid="timeline-playhead"]').should(
        'not.have.class',
        'playing'
      );

      // Test seek
      cy.get('[data-testid="timeline-track"]').click('center');
      cy.get('[data-testid="timeline-playhead"]').should(
        'have.attr',
        'data-time',
        '5000'
      );
    });

    it('should manage keyframes', () => {
      // Mock keyframe creation
      cy.intercept('POST', '/api/storyboards/1/scenes/1/elements/1/keyframes', {
        statusCode: 201,
        body: {
          id: 1,
          time: 2000,
          value: 75,
          property: 'radius',
        },
      }).as('createKeyframe');

      // Add keyframe
      cy.get('[data-testid="element-1"]').click();
      cy.get('[data-testid="add-keyframe"]').click();
      cy.get('[data-testid="keyframe-time"]').type('2000');
      cy.get('[data-testid="keyframe-value"]').type('75');
      cy.get('[data-testid="save-keyframe"]').click();
      cy.wait('@createKeyframe');

      // Verify keyframe
      cy.get('[data-testid="keyframe-1"]')
        .should('exist')
        .and('have.attr', 'data-time', '2000');
    });

    it('should handle timeline zoom', () => {
      // Test zoom in
      cy.get('[data-testid="zoom-in"]').click();
      cy.get('[data-testid="timeline-track"]').should(
        'have.attr',
        'data-zoom',
        '2'
      );

      // Test zoom out
      cy.get('[data-testid="zoom-out"]').click();
      cy.get('[data-testid="timeline-track"]').should(
        'have.attr',
        'data-zoom',
        '1'
      );
    });
  });

  describe('Asset Integration', () => {
    it('should manage assets', () => {
      // Mock asset upload
      cy.intercept('POST', '/api/storyboards/1/assets', {
        statusCode: 201,
        body: {
          id: 2,
          type: 'image',
          url: 'https://example.com/new-image.jpg',
          name: 'New Image',
        },
      }).as('uploadAsset');

      // Upload asset
      cy.get('[data-testid="asset-library"]').click();
      cy.get('[data-testid="upload-asset"]').attachFile({
        fileContent: 'test image content',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
      });
      cy.wait('@uploadAsset');

      // Verify asset
      cy.get('[data-testid="asset-2"]').should('exist');
    });

    it('should use assets in scenes', () => {
      // Mock element creation with asset
      cy.intercept('POST', '/api/storyboards/1/scenes/1/elements', {
        statusCode: 201,
        body: {
          id: 2,
          type: 'image',
          properties: {
            assetId: 1,
            x: 200,
            y: 200,
            width: 300,
            height: 200,
          },
        },
      }).as('createElement');

      // Add asset to scene
      cy.get('[data-testid="asset-1"]').drag('[data-testid="scene-canvas"]');
      cy.wait('@createElement');

      // Verify element creation
      cy.get('[data-testid="element-2"]')
        .should('exist')
        .and('have.class', 'image-element');
    });
  });

  describe('Collaboration Features', () => {
    it('should handle real-time updates', () => {
      // Mock WebSocket connection
      cy.window().then(win => {
        win.socketClient.emit('scene:update', {
          sceneId: 1,
          userId: 2,
          username: 'collaborator',
          changes: {
            elements: [
              {
                id: 1,
                properties: { radius: 60 },
              },
            ],
          },
        });
      });

      // Verify update reflection
      cy.get('[data-testid="element-1"]').should(
        'have.attr',
        'data-radius',
        '60'
      );
    });

    it('should show presence indicators', () => {
      // Mock collaborator presence
      cy.window().then(win => {
        win.socketClient.emit('user:joined', {
          userId: 2,
          username: 'collaborator',
          cursor: { x: 150, y: 150 },
        });
      });

      // Verify presence indicator
      cy.get('[data-testid="presence-cursor-2"]')
        .should('be.visible')
        .and('have.css', 'left', '150px')
        .and('have.css', 'top', '150px');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large scenes efficiently', () => {
      // Mock large scene data
      const elements = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        type: 'shape',
        properties: {
          type: 'circle',
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          radius: 20,
        },
      }));

      cy.intercept('GET', '/api/storyboards/2', {
        statusCode: 200,
        body: {
          id: 2,
          name: 'Large Storyboard',
          scenes: [
            {
              id: 1,
              elements,
            },
          ],
        },
      }).as('getLargeStoryboard');

      // Load large scene
      cy.visit('/storyboard/2');
      cy.wait('@getLargeStoryboard');

      // Verify rendering performance
      cy.window().then(win => {
        expect(win.performance.now()).to.be.lessThan(1000); // Load time < 1s
      });
    });

    it('should handle error states', () => {
      // Mock scene load error
      cy.intercept('GET', '/api/storyboards/999', {
        statusCode: 500,
        body: {
          error: 'Failed to load storyboard',
        },
      }).as('loadError');

      // Attempt to load invalid storyboard
      cy.visit('/storyboard/999');
      cy.wait('@loadError');

      // Verify error handling
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to load storyboard');

      // Test recovery
      cy.get('[data-testid="retry-load"]').click();
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
    });
  });
});
