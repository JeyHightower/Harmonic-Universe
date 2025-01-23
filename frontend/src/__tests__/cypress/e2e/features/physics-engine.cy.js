describe('Physics Engine Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock physics settings
    cy.intercept('GET', '/api/physics/settings', {
      statusCode: 200,
      body: {
        gravity: { x: 0, y: -9.81, z: 0 },
        timeStep: 1 / 60,
        iterations: 10,
        enableCollisions: true,
        particleSystemsEnabled: true,
      },
    }).as('getPhysicsSettings');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/physics');
    cy.wait('@getPhysicsSettings');
  });

  describe('Physics Initialization', () => {
    it('should initialize physics world', () => {
      cy.window().then(win => {
        expect(win.physicsWorld).to.exist;
        expect(win.physicsWorld.gravity).to.deep.equal({
          x: 0,
          y: -9.81,
          z: 0,
        });
      });

      cy.get('[data-testid="physics-status"]')
        .should('have.class', 'initialized')
        .and('contain', 'Physics Ready');
    });

    it('should configure physics settings', () => {
      cy.get('[data-testid="physics-settings"]').click();
      cy.get('[data-testid="gravity-y"]').clear().type('-20');
      cy.get('[data-testid="iterations"]').clear().type('20');
      cy.get('[data-testid="apply-settings"]').click();

      cy.get('[data-testid="physics-status"]').should(
        'contain',
        'Settings Updated'
      );
    });
  });

  describe('Rigid Body Simulation', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/physics/bodies', {
        statusCode: 200,
        body: {
          id: 1,
          type: 'box',
          position: { x: 0, y: 10, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          mass: 1,
        },
      }).as('createBody');
    });

    it('should create rigid body', () => {
      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('box');
      cy.get('[data-testid="body-mass"]').clear().type('1');
      cy.get('[data-testid="create-body"]').click();
      cy.wait('@createBody');

      cy.get('[data-testid="body-list"]').should('contain', 'Box Body 1');
    });

    it('should simulate gravity', () => {
      // Create body at height
      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('sphere');
      cy.get('[data-testid="position-y"]').clear().type('10');
      cy.get('[data-testid="create-body"]').click();
      cy.wait('@createBody');

      // Start simulation
      cy.get('[data-testid="start-simulation"]').click();

      // Wait for body to fall
      cy.get('[data-testid="body-position-y"]').should('contain', '0');
    });

    it('should apply forces', () => {
      cy.intercept('POST', '/api/physics/bodies/1/forces', {
        statusCode: 200,
        body: {
          force: { x: 100, y: 0, z: 0 },
          point: { x: 0, y: 0, z: 0 },
        },
      }).as('applyForce');

      // Create and select body
      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="create-body"]').click();
      cy.wait('@createBody');
      cy.get('[data-testid="body-1"]').click();

      // Apply force
      cy.get('[data-testid="apply-force"]').click();
      cy.get('[data-testid="force-x"]').clear().type('100');
      cy.get('[data-testid="apply-force-button"]').click();
      cy.wait('@applyForce');

      cy.get('[data-testid="body-velocity-x"]').should('not.equal', '0');
    });
  });

  describe('Collision Detection', () => {
    beforeEach(() => {
      // Create two bodies for collision testing
      cy.intercept('POST', '/api/physics/bodies', req => {
        const id = req.body.type === 'box' ? 1 : 2;
        req.reply({
          statusCode: 200,
          body: {
            id,
            type: req.body.type,
            position: req.body.position,
            rotation: { x: 0, y: 0, z: 0 },
            mass: 1,
          },
        });
      }).as('createBodies');
    });

    it('should detect collisions', () => {
      cy.intercept('GET', '/api/physics/collisions', {
        statusCode: 200,
        body: {
          collisions: [
            {
              bodyA: 1,
              bodyB: 2,
              point: { x: 0, y: 0, z: 0 },
              normal: { x: 1, y: 0, z: 0 },
              depth: 0.1,
            },
          ],
        },
      }).as('getCollisions');

      // Create two overlapping bodies
      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('box');
      cy.get('[data-testid="position-x"]').clear().type('-0.5');
      cy.get('[data-testid="create-body"]').click();

      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('sphere');
      cy.get('[data-testid="position-x"]').clear().type('0.5');
      cy.get('[data-testid="create-body"]').click();

      cy.wait('@createBodies');

      // Start simulation
      cy.get('[data-testid="start-simulation"]').click();
      cy.wait('@getCollisions');

      cy.get('[data-testid="collision-list"]').should(
        'contain',
        'Collision: Box 1 - Sphere 2'
      );
    });

    it('should handle collision response', () => {
      // Create two bodies for collision
      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('box');
      cy.get('[data-testid="position-x"]').clear().type('-2');
      cy.get('[data-testid="velocity-x"]').clear().type('1');
      cy.get('[data-testid="create-body"]').click();

      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('box');
      cy.get('[data-testid="position-x"]').clear().type('2');
      cy.get('[data-testid="velocity-x"]').clear().type('-1');
      cy.get('[data-testid="create-body"]').click();

      cy.wait('@createBodies');

      // Start simulation and verify collision response
      cy.get('[data-testid="start-simulation"]').click();

      // Bodies should reverse direction after collision
      cy.get('[data-testid="body-1-velocity-x"]').should('contain', '-1');
      cy.get('[data-testid="body-2-velocity-x"]').should('contain', '1');
    });
  });

  describe('Particle Systems', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/physics/particles', {
        statusCode: 200,
        body: {
          id: 1,
          maxParticles: 1000,
          emissionRate: 100,
          particleLifetime: 2,
          position: { x: 0, y: 0, z: 0 },
        },
      }).as('createParticleSystem');
    });

    it('should create particle system', () => {
      cy.get('[data-testid="add-particle-system"]').click();
      cy.get('[data-testid="emission-rate"]').clear().type('100');
      cy.get('[data-testid="particle-lifetime"]').clear().type('2');
      cy.get('[data-testid="create-particle-system"]').click();
      cy.wait('@createParticleSystem');

      cy.get('[data-testid="particle-system-list"]').should(
        'contain',
        'Particle System 1'
      );
    });

    it('should emit particles', () => {
      // Create particle system
      cy.get('[data-testid="add-particle-system"]').click();
      cy.get('[data-testid="create-particle-system"]').click();
      cy.wait('@createParticleSystem');

      // Start emission
      cy.get('[data-testid="start-emission"]').click();

      // Verify particle count increases
      cy.get('[data-testid="particle-count"]').should('not.equal', '0');
    });

    it('should configure particle properties', () => {
      cy.intercept('PUT', '/api/physics/particles/1', {
        statusCode: 200,
        body: {
          color: { r: 1, g: 0, b: 0 },
          size: 2,
          velocity: { x: 0, y: 1, z: 0 },
        },
      }).as('updateParticles');

      // Create and select particle system
      cy.get('[data-testid="add-particle-system"]').click();
      cy.get('[data-testid="create-particle-system"]').click();
      cy.wait('@createParticleSystem');
      cy.get('[data-testid="particle-system-1"]').click();

      // Configure particles
      cy.get('[data-testid="particle-color"]')
        .invoke('val', '#ff0000')
        .trigger('change');
      cy.get('[data-testid="particle-size"]').clear().type('2');
      cy.get('[data-testid="particle-velocity-y"]').clear().type('1');
      cy.get('[data-testid="apply-particle-properties"]').click();
      cy.wait('@updateParticles');

      cy.get('[data-testid="particle-system-1"]').should(
        'have.class',
        'configured'
      );
    });
  });

  describe('Force Fields', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/physics/forcefields', {
        statusCode: 200,
        body: {
          id: 1,
          type: 'radial',
          position: { x: 0, y: 0, z: 0 },
          radius: 5,
          strength: 10,
        },
      }).as('createForceField');
    });

    it('should create force field', () => {
      cy.get('[data-testid="add-force-field"]').click();
      cy.get('[data-testid="field-type"]').select('radial');
      cy.get('[data-testid="field-radius"]').clear().type('5');
      cy.get('[data-testid="field-strength"]').clear().type('10');
      cy.get('[data-testid="create-force-field"]').click();
      cy.wait('@createForceField');

      cy.get('[data-testid="force-field-list"]').should(
        'contain',
        'Radial Field 1'
      );
    });

    it('should affect bodies in range', () => {
      // Create force field
      cy.get('[data-testid="add-force-field"]').click();
      cy.get('[data-testid="field-type"]').select('radial');
      cy.get('[data-testid="create-force-field"]').click();
      cy.wait('@createForceField');

      // Create body in field range
      cy.get('[data-testid="add-body"]').click();
      cy.get('[data-testid="body-type"]').select('sphere');
      cy.get('[data-testid="position-x"]').clear().type('2');
      cy.get('[data-testid="create-body"]').click();

      // Start simulation
      cy.get('[data-testid="start-simulation"]').click();

      // Verify body is affected by field
      cy.get('[data-testid="body-acceleration"]').should('not.equal', '0');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', () => {
      cy.intercept('GET', '/api/physics/settings', {
        statusCode: 500,
        body: {
          error: 'Failed to initialize physics',
        },
      }).as('initError');

      cy.reload();
      cy.wait('@initError');

      cy.get('[data-testid="physics-error"]')
        .should('be.visible')
        .and('contain', 'Failed to initialize physics');
    });

    it('should handle simulation errors', () => {
      cy.intercept('POST', '/api/physics/simulate', {
        statusCode: 500,
        body: {
          error: 'Simulation failed',
        },
      }).as('simulationError');

      cy.get('[data-testid="start-simulation"]').click();
      cy.wait('@simulationError');

      cy.get('[data-testid="simulation-error"]')
        .should('be.visible')
        .and('contain', 'Simulation failed');
    });

    it('should handle particle system errors', () => {
      cy.intercept('POST', '/api/physics/particles', {
        statusCode: 500,
        body: {
          error: 'Failed to create particle system',
        },
      }).as('particleError');

      cy.get('[data-testid="add-particle-system"]').click();
      cy.get('[data-testid="create-particle-system"]').click();
      cy.wait('@particleError');

      cy.get('[data-testid="particle-error"]')
        .should('be.visible')
        .and('contain', 'Failed to create particle system');
    });
  });
});
