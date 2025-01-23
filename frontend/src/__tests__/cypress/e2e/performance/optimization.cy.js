describe('Performance & Optimization', () => {
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
        optimization_settings: {
          particle_batching: true,
          audio_buffering: true,
          render_quality: 'high',
          physics_precision: 'high',
        },
      },
    }).as('getUniverse');

    // Mock performance metrics
    cy.intercept('GET', '/api/universes/1/performance', {
      statusCode: 200,
      body: {
        fps: 60,
        frame_time: 16.67,
        memory_usage: 512,
        audio_latency: 20,
        physics_time: 5,
        render_time: 8,
        particle_count: 1000,
        active_audio_sources: 5,
      },
    }).as('getPerformance');

    // Mock optimization suggestions
    cy.intercept('GET', '/api/universes/1/optimization-suggestions', {
      statusCode: 200,
      body: {
        suggestions: [
          {
            type: 'particles',
            message: 'Consider reducing particle count',
            impact: 'high',
            current_value: 1000,
            recommended_value: 500,
          },
          {
            type: 'audio',
            message: 'Enable audio buffering',
            impact: 'medium',
            current_setting: false,
            recommended_setting: true,
          },
        ],
      },
    }).as('getOptimizationSuggestions');

    // Login and navigate
    cy.login();
    cy.visit('/universes/1/performance');
    cy.wait(['@getUniverse', '@getPerformance']);
  });

  describe('Performance Monitoring', () => {
    it('should display performance metrics', () => {
      cy.get('[data-testid="performance-metrics"]').within(() => {
        cy.get('[data-testid="fps"]')
          .should('contain', 'FPS')
          .and('contain', '60');
        cy.get('[data-testid="frame-time"]')
          .should('contain', 'Frame Time')
          .and('contain', '16.67ms');
        cy.get('[data-testid="memory-usage"]')
          .should('contain', 'Memory')
          .and('contain', '512MB');
      });

      cy.get('[data-testid="detailed-metrics"]').within(() => {
        cy.get('[data-testid="physics-time"]')
          .should('contain', 'Physics')
          .and('contain', '5ms');
        cy.get('[data-testid="render-time"]')
          .should('contain', 'Render')
          .and('contain', '8ms');
        cy.get('[data-testid="audio-latency"]')
          .should('contain', 'Audio Latency')
          .and('contain', '20ms');
      });
    });

    it('should update metrics in real-time', () => {
      // Mock WebSocket for real-time updates
      cy.window().then(win => {
        win.postMessage(
          {
            type: 'performance_update',
            data: {
              fps: 55,
              frame_time: 18.2,
              memory_usage: 600,
            },
          },
          '*'
        );
      });

      cy.get('[data-testid="fps"]').should('contain', '55');
      cy.get('[data-testid="frame-time"]').should('contain', '18.2');
      cy.get('[data-testid="memory-usage"]').should('contain', '600');
    });
  });

  describe('Optimization Settings', () => {
    it('should display optimization settings', () => {
      cy.get('[data-testid="optimization-settings"]').within(() => {
        cy.get('[data-testid="particle-batching"]').should('be.checked');
        cy.get('[data-testid="audio-buffering"]').should('be.checked');
        cy.get('[data-testid="render-quality"]').should('have.value', 'high');
        cy.get('[data-testid="physics-precision"]').should(
          'have.value',
          'high'
        );
      });
    });

    it('should update optimization settings', () => {
      cy.intercept('PUT', '/api/universes/1/optimization', {
        statusCode: 200,
        body: {
          particle_batching: true,
          audio_buffering: true,
          render_quality: 'medium',
          physics_precision: 'medium',
        },
      }).as('updateOptimization');

      cy.get('[data-testid="render-quality"]').select('medium');
      cy.get('[data-testid="physics-precision"]').select('medium');
      cy.get('[data-testid="apply-optimization"]').click();

      cy.wait('@updateOptimization');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Optimization settings updated'
      );
    });
  });

  describe('Resource Management', () => {
    it('should display resource usage', () => {
      cy.get('[data-testid="resource-usage"]').within(() => {
        cy.get('[data-testid="particle-count"]')
          .should('contain', '1000')
          .and('contain', 'particles');
        cy.get('[data-testid="audio-sources"]')
          .should('contain', '5')
          .and('contain', 'audio sources');
      });
    });

    it('should handle resource limits', () => {
      // Mock resource limit warning
      cy.intercept('POST', '/api/universes/1/particles', {
        statusCode: 400,
        body: {
          error: 'Particle limit reached',
          current: 1000,
          limit: 1000,
        },
      }).as('particleLimitError');

      cy.get('[data-testid="add-particles"]').click();
      cy.wait('@particleLimitError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Particle limit reached'
      );
    });
  });

  describe('Optimization Suggestions', () => {
    it('should display optimization suggestions', () => {
      cy.get('[data-testid="optimization-suggestions"]').within(() => {
        cy.get('[data-testid="suggestion-particles"]')
          .should('contain', 'reducing particle count')
          .and('contain', 'high');
        cy.get('[data-testid="suggestion-audio"]')
          .should('contain', 'audio buffering')
          .and('contain', 'medium');
      });
    });

    it('should apply optimization suggestions', () => {
      cy.intercept('POST', '/api/universes/1/apply-optimization', {
        statusCode: 200,
        body: {
          applied: ['particles'],
          new_settings: {
            particle_count: 500,
          },
        },
      }).as('applyOptimization');

      cy.get('[data-testid="apply-suggestion-particles"]').click();
      cy.wait('@applyOptimization');

      cy.get('[data-testid="particle-count"]').should('contain', '500');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Optimization applied'
      );
    });
  });

  describe('Performance Profiling', () => {
    it('should start performance profiling', () => {
      cy.intercept('POST', '/api/universes/1/profile', {
        statusCode: 200,
        body: {
          profile_id: 'test-profile',
          status: 'started',
        },
      }).as('startProfile');

      cy.get('[data-testid="start-profile"]').click();
      cy.wait('@startProfile');
      cy.get('[data-testid="profiling-status"]').should('contain', 'Recording');
    });

    it('should display profile results', () => {
      cy.intercept('GET', '/api/universes/1/profile/test-profile', {
        statusCode: 200,
        body: {
          duration: 60,
          samples: [
            {
              timestamp: '2024-01-20T12:00:00Z',
              fps: 60,
              frame_time: 16.67,
              memory_usage: 512,
            },
            {
              timestamp: '2024-01-20T12:00:01Z',
              fps: 58,
              frame_time: 17.24,
              memory_usage: 524,
            },
          ],
          hotspots: [
            {
              type: 'physics',
              location: 'particle_collision',
              time_percentage: 40,
            },
            {
              type: 'render',
              location: 'particle_render',
              time_percentage: 30,
            },
          ],
        },
      }).as('getProfileResults');

      cy.get('[data-testid="view-profile"]').click();
      cy.wait('@getProfileResults');

      cy.get('[data-testid="profile-results"]').within(() => {
        cy.get('[data-testid="profile-duration"]').should('contain', '60');
        cy.get('[data-testid="profile-samples"]').should('have.length', 2);
        cy.get('[data-testid="profile-hotspots"]').should('have.length', 2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle performance monitoring errors', () => {
      cy.intercept('GET', '/api/universes/1/performance', {
        statusCode: 500,
        body: {
          error: 'Performance monitoring unavailable',
        },
      }).as('performanceError');

      cy.reload();
      cy.wait('@performanceError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Performance monitoring unavailable'
      );
    });

    it('should handle optimization errors', () => {
      cy.intercept('PUT', '/api/universes/1/optimization', {
        statusCode: 400,
        body: {
          error: 'Invalid optimization settings',
        },
      }).as('optimizationError');

      cy.get('[data-testid="render-quality"]').select('ultra');
      cy.get('[data-testid="apply-optimization"]').click();

      cy.wait('@optimizationError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Invalid optimization settings'
      );
    });
  });
});
